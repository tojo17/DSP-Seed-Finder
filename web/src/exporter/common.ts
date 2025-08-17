import { gasNames, gasOrder, veinNames, veinOrder } from "../util"

export enum StarField {
    Seed = "种子",
    Index = "索引",
    Name = "名称",
    PositionX = "X",
    PositionY = "Y",
    PositionZ = "Z",
    Mass = "质量",
    Age = "年龄",
    Temperature = "温度",
    Type = "类型",
    Spectr = "光谱类型",
    Luminosity = "亮度",
    Radius = "半径",
    DysonRadius = "最大戴森球半径",
    DistanceFromBirth = "距离初始星系",
    DistanceFromNearestX = "距离最近X型恒星",
    DistanceFromFurthestX = "距离最远X型恒星",
}

export const starFieldsOrder = [
    StarField.Seed,
    StarField.Index,
    StarField.Name,
    StarField.Type,
    StarField.Spectr,
    StarField.Luminosity,
    StarField.PositionX,
    StarField.PositionY,
    StarField.PositionZ,
    StarField.DistanceFromBirth,
    StarField.DistanceFromNearestX,
    StarField.DistanceFromFurthestX,
    StarField.Radius,
    StarField.DysonRadius,
    StarField.Mass,
    StarField.Age,
    StarField.Temperature,
]

export enum PlanetField {
    Seed = "种子",
    Index = "索引",
    Name = "名称",
    Theme = "主题",
    Orbiting = "绕行",
    TidallyLocked = "潮汐锁定",
    OrbitRadius = "轨道半径",
    OrbitInclination = "轨道倾角",
    OrbitLongitude = "轨道经度",
    OrbitalPeriod = "轨道周期",
    OrbitPhase = "轨道相位",
    Obliquity = "倾斜度",
    RotationPeriod = "自转周期",
    RotationPhase = "自转相位",
    Wind = "风能强度",
    Luminosity = "太阳能强度",
}

export const planetFieldsOrder = [
    PlanetField.Seed,
    PlanetField.Index,
    PlanetField.Name,
    PlanetField.Theme,
    PlanetField.Orbiting,
    PlanetField.TidallyLocked,
    PlanetField.Wind,
    PlanetField.Luminosity,
    PlanetField.OrbitRadius,
    PlanetField.OrbitInclination,
    PlanetField.OrbitLongitude,
    PlanetField.OrbitalPeriod,
    PlanetField.OrbitPhase,
    PlanetField.Obliquity,
    PlanetField.RotationPeriod,
    PlanetField.RotationPhase,
]

export const veinFieldsOrder = [
    ...veinOrder.flatMap((type) => {
        const name = veinNames[type]
        return [`${name} (平均)`, `${name} (最小)`, `${name} (最大)`]
    }),
    "水",
    "硫酸",
    ...gasOrder.map((type) => gasNames[type]),
]
