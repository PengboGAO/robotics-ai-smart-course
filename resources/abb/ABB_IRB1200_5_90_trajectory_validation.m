function results = ABB_IRB1200_5_90_trajectory_validation(outputDirectory)
if nargin < 1
    outputDirectory = pwd;
end
if ~exist(outputDirectory, "dir")
    mkdir(outputDirectory);
end

jointOrigins = [
    0, 0, 0.3991;
    0, 0, 0;
    0, 0, 0.4480;
    0, 0, 0.0420;
    0.4510, 0, 0;
    0.0820, 0, 0
];
jointAxes = [
    0, 0, 1;
    0, 1, 0;
    0, 1, 0;
    1, 0, 0;
    0, 1, 0;
    1, 0, 0
];
jointLimitsDeg = [
    -170, 170;
    -100, 130;
    -200, 70;
    -270, 270;
    -130, 130;
    -400, 400
];
maximumSpeedDegPerSecond = [288, 240, 297, 400, 405, 600];
dhAMeters = [0, 0.4480, 0.0420, 0, 0, 0];
dhAlphaRad = deg2rad([-90, 0, -90, 90, -90, 0]);
dhDMeters = [0.3991, 0, 0, 0.4510, 0, 0.0820];
dhThetaOffsetRad = deg2rad([0, -90, 0, 0, 0, 0]);

officialPoints = [
     451,  889,    0,    0;
       0, 1300,    0,  -85;
     194,  438,    0,   70;
     901,  402,   90,  -85;
     692, -178,  130,  -85;
    -179,  -48, -100, -200;
     -72,  583, -100,   70;
    -901,  397,  -90,  -85;
    -887,  240, -100,  -85;
     458,  549,  130, -200
];

calculatedPoints = zeros(size(officialPoints, 1), 2);
for pointIndex = 1:size(officialPoints, 1)
    qDeg = [0, officialPoints(pointIndex, 3:4), 0, 0, 0];
    [~, jointPositions] = forwardKinematics(deg2rad(qDeg), jointOrigins, jointAxes);
    calculatedPoints(pointIndex, :) = 1000 .* jointPositions(5, [1, 3]);
end
pointErrorsMm = vecnorm(calculatedPoints - officialPoints(:, 1:2), 2, 2);
assert(max(pointErrorsMm) <= 3.0, "ABB官方工作空间边界点复算未通过");

qStartDeg = [0, -30, 20, 0, 30, 0];
qGoalDeg = [60, 40, -70, 100, 45, 180];
durationSeconds = 3.0;
sampleCount = 601;
timeSeconds = linspace(0, durationSeconds, sampleCount).';
normalizedTime = timeSeconds ./ durationSeconds;
blend = 10 .* normalizedTime.^3 - 15 .* normalizedTime.^4 + 6 .* normalizedTime.^5;
blendVelocity = (30 .* normalizedTime.^2 - 60 .* normalizedTime.^3 + 30 .* normalizedTime.^4) ./ durationSeconds;
blendAcceleration = (60 .* normalizedTime - 180 .* normalizedTime.^2 + 120 .* normalizedTime.^3) ./ durationSeconds.^2;
jointDeltaDeg = qGoalDeg - qStartDeg;
qDeg = qStartDeg + blend .* jointDeltaDeg;
qdDegPerSecond = blendVelocity .* jointDeltaDeg;
qddDegPerSecondSquared = blendAcceleration .* jointDeltaDeg;

positionPass = all(qDeg >= jointLimitsDeg(:, 1).' & qDeg <= jointLimitsDeg(:, 2).', "all");
peakSpeedDegPerSecond = max(abs(qdDegPerSecond), [], 1);
speedPass = all(peakSpeedDegPerSecond <= maximumSpeedDegPerSecond);
endpointVelocityPass = max(abs(qdDegPerSecond([1, end], :)), [], "all") < 1e-10;
endpointAccelerationPass = max(abs(qddDegPerSecondSquared([1, end], :)), [], "all") < 1e-10;
assert(positionPass && speedPass && endpointVelocityPass && endpointAccelerationPass, "六轴轨迹约束检查未通过");

dhCheckConfigurationsDeg = [
    qStartDeg;
    qGoalDeg;
    30, -35, 40, 45, 20, 60;
    -45, 10, -30, -80, 65, -120;
    90, -60, 50, 120, -40, 250
];
dhPositionErrorsMeters = zeros(size(dhCheckConfigurationsDeg, 1), 1);
dhRotationErrors = zeros(size(dhCheckConfigurationsDeg, 1), 1);
for configurationIndex = 1:size(dhCheckConfigurationsDeg, 1)
    qRad = deg2rad(dhCheckConfigurationsDeg(configurationIndex, :));
    referenceTransform = forwardKinematics(qRad, jointOrigins, jointAxes);
    dhTransform = forwardKinematicsDh(qRad, dhAMeters, dhAlphaRad, dhDMeters, dhThetaOffsetRad);
    dhPositionErrorsMeters(configurationIndex) = norm(referenceTransform(1:3, 4) - dhTransform(1:3, 4));
    dhRotationErrors(configurationIndex) = norm(referenceTransform(1:3, 1:3) - dhTransform(1:3, 1:3), "fro");
end
dhPositionDifferenceMeters = max(dhPositionErrorsMeters);
dhRotationDifference = max(dhRotationErrors);
assert(dhPositionDifferenceMeters < 1e-10 && dhRotationDifference < 1e-10, "D-H链与URDF参考链不一致");

goalFlangeTransform = forwardKinematics(deg2rad(qGoalDeg), jointOrigins, jointAxes);
initialGuessDeg = qGoalDeg + [4, -4, 4, -4, 4, -4];
[inverseSolutionRad, inverseIterations, inversePositionErrorMeters, inverseOrientationErrorRad] = inverseKinematicsDls(...
    goalFlangeTransform, deg2rad(initialGuessDeg), jointOrigins, jointAxes, jointLimitsDeg);
assert(inversePositionErrorMeters < 1e-6 && inverseOrientationErrorRad < 1e-6, "正解-逆解-正解一致性检查未通过");

minimumJacobianSingularValue = inf;
for sampleIndex = 1:sampleCount
    jacobian = geometricJacobian(deg2rad(qDeg(sampleIndex, :)), jointOrigins, jointAxes);
    singularValues = svd(jacobian);
    minimumJacobianSingularValue = min(minimumJacobianSingularValue, singularValues(end));
end
minimumAbsSinAxis5 = min(abs(sin(deg2rad(qDeg(:, 5)))));

rejectedGoalDeg = [60, 40, -70, 100, -45, 180];
rejectedQDeg = qStartDeg + blend .* (rejectedGoalDeg - qStartDeg);
rejectedMinimumJacobianSingularValue = inf;
rejectedMinimumSample = 1;
for sampleIndex = 1:sampleCount
    jacobian = geometricJacobian(deg2rad(rejectedQDeg(sampleIndex, :)), jointOrigins, jointAxes);
    singularValues = svd(jacobian);
    if singularValues(end) < rejectedMinimumJacobianSingularValue
        rejectedMinimumJacobianSingularValue = singularValues(end);
        rejectedMinimumSample = sampleIndex;
    end
end

flangePathMeters = zeros(sampleCount, 3);
for sampleIndex = 1:sampleCount
    [flangeTransform] = forwardKinematics(deg2rad(qDeg(sampleIndex, :)), jointOrigins, jointAxes);
    flangePathMeters(sampleIndex, :) = flangeTransform(1:3, 4).';
end

figure("Color", "white", "Position", [80, 80, 1180, 760]);
for axisIndex = 1:6
    subplot(2, 3, axisIndex);
    plot(timeSeconds, qDeg(:, axisIndex), "LineWidth", 1.8);
    hold on;
    yline(jointLimitsDeg(axisIndex, 1), "--", "Color", [0.55, 0.60, 0.65]);
    yline(jointLimitsDeg(axisIndex, 2), "--", "Color", [0.55, 0.60, 0.65]);
    grid on;
    title(sprintf("A%d  峰值速度 %.1f°/s", axisIndex, peakSpeedDegPerSecond(axisIndex)));
    xlabel("时间 / s");
    ylabel("角度 / °");
end
exportgraphics(gcf, fullfile(outputDirectory, "ABB_IRB1200_六轴轨迹.png"), "Resolution", 220);

variableNames = ["time_s", compose("q_deg_A%d", 1:6), compose("qd_deg_s_A%d", 1:6), compose("qdd_deg_s2_A%d", 1:6), "flange_x_m", "flange_y_m", "flange_z_m"];
sampleTable = array2table([timeSeconds, qDeg, qdDegPerSecond, qddDegPerSecondSquared, flangePathMeters], "VariableNames", variableNames);
writetable(sampleTable, fullfile(outputDirectory, "ABB_IRB1200_六轴轨迹样本.csv"));

results = struct;
results.model = "ABB IRB 1200-5/0.9";
results.maximumOfficialPointErrorMm = max(pointErrorsMm);
results.officialPointToleranceMm = 3.0;
results.officialPointToleranceScope = "作者为复算ABB表格整数显示值设置的容差，不是ABB精度或验收指标";
results.officialPointErrorsMm = pointErrorsMm;
results.dhConvention = "标准D-H；法兰坐标系使用固定姿态对齐到ROS-Industrial参考链";
results.dhAMeters = dhAMeters;
results.dhAlphaDeg = rad2deg(dhAlphaRad);
results.dhDMeters = dhDMeters;
results.dhThetaOffsetDeg = rad2deg(dhThetaOffsetRad);
results.dhMaximumPositionDifferenceMeters = dhPositionDifferenceMeters;
results.dhMaximumRotationFrobeniusDifference = dhRotationDifference;
results.qStartDeg = qStartDeg;
results.qGoalDeg = qGoalDeg;
results.durationSeconds = durationSeconds;
results.peakSpeedDegPerSecond = peakSpeedDegPerSecond;
results.speedUtilizationPercent = 100 .* peakSpeedDegPerSecond ./ maximumSpeedDegPerSecond;
results.positionPass = positionPass;
results.speedPass = speedPass;
results.endpointVelocityPass = endpointVelocityPass;
results.endpointAccelerationPass = endpointAccelerationPass;
results.flangePathLengthMeters = sum(vecnorm(diff(flangePathMeters), 2, 2));
results.maximumSpeedSupplyCondition = "ABB三相200-600 V参数；实体执行前核对控制柜供电条件";
results.inverseInitialGuessDeg = initialGuessDeg;
results.inverseSolutionDeg = rad2deg(inverseSolutionRad);
results.inverseIterations = inverseIterations;
results.inversePositionErrorMeters = inversePositionErrorMeters;
results.inverseOrientationErrorRad = inverseOrientationErrorRad;
results.minimumJacobianSingularValue = minimumJacobianSingularValue;
results.minimumAbsSinAxis5 = minimumAbsSinAxis5;
results.rejectedSingularityGoalDeg = rejectedGoalDeg;
results.rejectedMinimumJacobianSingularValue = rejectedMinimumJacobianSingularValue;
results.rejectedAxis5DegAtMinimum = rejectedQDeg(rejectedMinimumSample, 5);
results.singularityMetricScope = "几何雅可比筛查量，不是ABB控制器验收阈值";
results.collisionAndRobotStudioStatus = "待验证：缺少RobotStudio站点、tooldata、loaddata、wobjdata、碰撞集和虚拟控制器事件日志";

jsonText = jsonencode(results, PrettyPrint=true);
fileIdentifier = fopen(fullfile(outputDirectory, "ABB_IRB1200_复算结果.json"), "w", "n", "UTF-8");
fwrite(fileIdentifier, jsonText, "char");
fclose(fileIdentifier);
end

function [flangeTransform, jointPositions, linkTransforms, jointAxesWorld] = forwardKinematics(qRad, jointOrigins, jointAxes)
flangeTransform = eye(4);
jointPositions = zeros(6, 3);
linkTransforms = zeros(4, 4, 6);
jointAxesWorld = zeros(6, 3);
for axisIndex = 1:6
    flangeTransform = flangeTransform * translationMatrix(jointOrigins(axisIndex, :));
    jointPositions(axisIndex, :) = flangeTransform(1:3, 4).';
    jointAxesWorld(axisIndex, :) = (flangeTransform(1:3, 1:3) * jointAxes(axisIndex, :).').';
    flangeTransform = flangeTransform * axisRotationMatrix(jointAxes(axisIndex, :), qRad(axisIndex));
    linkTransforms(:, :, axisIndex) = flangeTransform;
end
end

function transform = forwardKinematicsDh(qRad, aMeters, alphaRad, dMeters, thetaOffsetRad)
transform = eye(4);
for axisIndex = 1:6
    transform = transform * standardDhMatrix(qRad(axisIndex) + thetaOffsetRad(axisIndex), dMeters(axisIndex), aMeters(axisIndex), alphaRad(axisIndex));
end
zeroTransform = eye(4);
for axisIndex = 1:6
    zeroTransform = zeroTransform * standardDhMatrix(thetaOffsetRad(axisIndex), dMeters(axisIndex), aMeters(axisIndex), alphaRad(axisIndex));
end
toolAlignment = eye(4);
toolAlignment(1:3, 1:3) = zeroTransform(1:3, 1:3).';
transform = transform * toolAlignment;
end

function transform = standardDhMatrix(theta, dValue, aValue, alpha)
cosineTheta = cos(theta);
sineTheta = sin(theta);
cosineAlpha = cos(alpha);
sineAlpha = sin(alpha);
transform = [
    cosineTheta, -sineTheta * cosineAlpha, sineTheta * sineAlpha, aValue * cosineTheta;
    sineTheta, cosineTheta * cosineAlpha, -cosineTheta * sineAlpha, aValue * sineTheta;
    0, sineAlpha, cosineAlpha, dValue;
    0, 0, 0, 1
];
end

function jacobian = geometricJacobian(qRad, jointOrigins, jointAxes)
[flangeTransform, jointPositions, ~, jointAxesWorld] = forwardKinematics(qRad, jointOrigins, jointAxes);
flangePosition = flangeTransform(1:3, 4);
jacobian = zeros(6, 6);
for axisIndex = 1:6
    axisWorld = jointAxesWorld(axisIndex, :).';
    jointPosition = jointPositions(axisIndex, :).';
    jacobian(1:3, axisIndex) = cross(axisWorld, flangePosition - jointPosition);
    jacobian(4:6, axisIndex) = axisWorld;
end
end

function errorVector = poseError(currentTransform, targetTransform)
positionError = targetTransform(1:3, 4) - currentTransform(1:3, 4);
orientationError = 0.5 .* (...
    cross(currentTransform(1:3, 1), targetTransform(1:3, 1)) + ...
    cross(currentTransform(1:3, 2), targetTransform(1:3, 2)) + ...
    cross(currentTransform(1:3, 3), targetTransform(1:3, 3)));
errorVector = [positionError; orientationError];
end

function [qRad, iterationCount, positionErrorMeters, orientationErrorRad] = inverseKinematicsDls(targetTransform, initialQRad, jointOrigins, jointAxes, jointLimitsDeg)
qRad = initialQRad(:).';
lowerRad = deg2rad(jointLimitsDeg(:, 1)).';
upperRad = deg2rad(jointLimitsDeg(:, 2)).';
damping = 1e-3;
for iterationCount = 1:300
    currentTransform = forwardKinematics(qRad, jointOrigins, jointAxes);
    errorVector = poseError(currentTransform, targetTransform);
    positionErrorMeters = norm(errorVector(1:3));
    orientationErrorRad = norm(errorVector(4:6));
    if positionErrorMeters < 1e-9 && orientationErrorRad < 1e-9
        return;
    end
    jacobian = geometricJacobian(qRad, jointOrigins, jointAxes);
    step = jacobian.' * ((jacobian * jacobian.' + damping^2 .* eye(6)) \ errorVector);
    qRad = min(max(qRad + step.', lowerRad), upperRad);
end
currentTransform = forwardKinematics(qRad, jointOrigins, jointAxes);
errorVector = poseError(currentTransform, targetTransform);
positionErrorMeters = norm(errorVector(1:3));
orientationErrorRad = norm(errorVector(4:6));
end

function transform = translationMatrix(vector)
transform = eye(4);
transform(1:3, 4) = vector(:);
end

function transform = axisRotationMatrix(axisVector, angle)
axisVector = axisVector ./ norm(axisVector);
xValue = axisVector(1);
yValue = axisVector(2);
zValue = axisVector(3);
cosine = cos(angle);
sine = sin(angle);
oneMinusCosine = 1 - cosine;
rotation = [
    cosine + xValue^2 * oneMinusCosine, xValue * yValue * oneMinusCosine - zValue * sine, xValue * zValue * oneMinusCosine + yValue * sine;
    yValue * xValue * oneMinusCosine + zValue * sine, cosine + yValue^2 * oneMinusCosine, yValue * zValue * oneMinusCosine - xValue * sine;
    zValue * xValue * oneMinusCosine - yValue * sine, zValue * yValue * oneMinusCosine + xValue * sine, cosine + zValue^2 * oneMinusCosine
];
transform = eye(4);
transform(1:3, 1:3) = rotation;
end
