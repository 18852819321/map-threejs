import * as THREE from "three";
import * as d3 from "d3";
import { CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer";

import {
  GeoJsonType,
  GeoJsonFeature,
  GeometryCoordinates,
  GeometryType,
  ExtendObject3D,
} from "./typed";
import { ProjectionFnParamType } from ".";

const arr = ['江苏省', '上海市', '广东省', '云南省', '陕西省', '江西省', '吉林省', '内蒙古自治区', '西藏自治区']
// 绘制挤出的材质
export function drawExtrudeMesh(
  point: [number, number][],
  projectionFn: any,
  name: string,
): any {
  const shape = new THREE.Shape();

  for (let i = 0; i < point.length; i++) {
    const [x, y]: any = projectionFn(point[i]); // 将每一个经纬度转化为坐标点
    if (i === 0) {
      shape.moveTo(x, -y);
    }
    shape.lineTo(x, -y);
  }

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 2, // 挤出的形状深度
    bevelEnabled: false, // 对挤出的形状应用是否斜角
  });

  const material = new THREE.MeshPhongMaterial({
    color: arr.includes(name) ? "#0cc5ae" : "#000",
    transparent: true,
    opacity: 0.9,
  });

  const materialSide = new THREE.ShaderMaterial({
    uniforms: {
      color1: {
        value: new THREE.Color("#001524"),
      },
      color2: {
        value: new THREE.Color("#001524"),
      },
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
        }
      `,
    fragmentShader: `
          uniform vec3 color1;
          uniform vec3 color2;
          varying vec2 vUv;
          void main() {
            gl_FragColor = vec4(mix(color1, color2, vUv.y), 1.0);
          }
        `,
    //   wireframe: true,
  });

  const mesh: any = new THREE.Mesh(geometry, [material, materialSide]);
  // userData 存储自定义属性
  mesh.userData = {
    isChangeColor: true,
  };
  return { mesh };
}

// 生成地图3D模型
export function generateMapObject3D(
  mapdata: GeoJsonType,
  projectionFnParam: ProjectionFnParamType
) {
  // 地图对象
  const mapObject3D = new THREE.Object3D();
  // 地图数据
  const { features: basicFeatures } = mapdata;

  const { center, scale } = projectionFnParam;

  const projectionFn = d3
    .geoMercator()
    .center(center)
    .scale(scale)
    .translate([0, 0]);

  const label2dData: any = []; // 存储自定义 2d 标签数据

  // 每个省的数据
  basicFeatures.forEach((basicFeatureItem: GeoJsonFeature) => {
    // 每个省份的地图对象
    const provinceMapObject3D = new THREE.Object3D() as ExtendObject3D;

    // console.log(provinceMapObject3D.);
    // 将地图数据挂在到模型数据上
    provinceMapObject3D.customProperties = basicFeatureItem.properties;

    // 每个坐标类型
    const featureType = basicFeatureItem.geometry.type;
    // 每个坐标数组
    const featureCoords: GeometryCoordinates<GeometryType> =
      basicFeatureItem.geometry.coordinates;
    // 每个中心点位置
    const featureCenterCoord: any =
      basicFeatureItem.properties.centroid &&
      projectionFn(basicFeatureItem.properties.centroid);
    // 名字
    const featureName: string = basicFeatureItem.properties.name;

    if (featureCenterCoord) {
      label2dData.push({
        featureCenterCoord,
        featureName,
      });
    }

    // MultiPolygon 类型
    if (featureType === "MultiPolygon") {
      featureCoords.forEach((multiPolygon: [number, number][][]) => {
        multiPolygon.forEach((polygon: [number, number][]) => {
          const { mesh } = drawExtrudeMesh(polygon, projectionFn, basicFeatureItem.properties.name);
          provinceMapObject3D.add(mesh);
        });
      });
    }

    // Polygon 类型
    if (featureType === "Polygon") {
      featureCoords.forEach((polygon: [number, number][]) => {
        const { mesh } = drawExtrudeMesh(polygon, projectionFn, basicFeatureItem.properties.name);
        provinceMapObject3D.add(mesh);
      });
    }

    mapObject3D.add(provinceMapObject3D);
  });

  return { mapObject3D, label2dData };
}

// 绘制二维标签
export const draw2dLabel = (coord: [number, number], proviceName: string) => {
  if (coord && coord.length) {
    const labelDiv = document.createElement("div");
    labelDiv.innerText = proviceName;
    labelDiv.style.color = "#fff";
    labelDiv.style.fontSize = "10px";
    const labelObject = new CSS2DObject(labelDiv);
    labelObject.position.set(coord[0], -coord[1], 0);
    return labelObject;
  }
};

// Z 轴坐标
const POSITION_Z = 3.1;

// 绘制圆点
export const drawSpot = (coord: [number, number]) => {
  if (coord && coord.length) {
    /**
     * 绘制圆点
     */
    const spotGeometry = new THREE.CircleGeometry(0.2, 200);
    const spotMaterial = new THREE.MeshBasicMaterial({
      color: "#3EC5FB",
      side: THREE.DoubleSide,
    });
    const circle = new THREE.Mesh(spotGeometry, spotMaterial);
    circle.position.set(coord[0], -coord[1], POSITION_Z);

    // 圆环
    const ringGeometry = new THREE.RingGeometry(0.2, 0.3, 50);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: "#3FC5FB",
      side: THREE.DoubleSide,
      transparent: true,
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.position.set(coord[0], -coord[1], POSITION_Z);
    return { circle, ring };
  }
};

/**
 * 线上移动物体
 */
export const drawflySpot = (curve: any) => {
  const aGeo = new THREE.SphereGeometry(0.2);
  const aMater = new THREE.MeshBasicMaterial({
    color: "#77f077",
    side: THREE.DoubleSide,
  });
  const aMesh: any = new THREE.Mesh(aGeo, aMater);
  // 保存曲线实例
  aMesh.curve = curve;
  aMesh._s = 0;
  return aMesh;
};

// 绘制两点链接飞线
export const drawLineBetween2Spot = (
  coordStart: [number, number],
  coordEnd: [number, number]
) => {
  const [x0, y0, z0] = [...coordStart, POSITION_Z];
  const [x1, y1, z1] = [...coordEnd, POSITION_Z];
  // 使用 QuadraticBezierCurve3 创建 三维二次贝塞尔曲线
  const curve = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(x0, -y0, z0),
    new THREE.Vector3((x0 + x1) / 2, -(y0 + y1) / 2, 20),
    new THREE.Vector3(x1, -y1, z1)
  );

  const flySpot = drawflySpot(curve);

  const lineGeometry = new THREE.BufferGeometry();
  // 获取曲线上50个点
  const points = curve.getPoints(50);
  const positions = [];
  const colors = [];
  const color = new THREE.Color();

  // 给每个顶点设置演示 实现渐变
  for (let j = 0; j < points.length; j++) {
    color.setHSL(0.21 + j, 0.77, 0.55 + j * 0.0025); // 色
    colors.push(color.r, color.g, color.b);
    positions.push(points[j].x, points[j].y, points[j].z);
  }
  // 放入顶点 和 设置顶点颜色
  lineGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(new Float32Array(positions), 3, true)
  );
  lineGeometry.setAttribute(
    "color",
    new THREE.BufferAttribute(new Float32Array(colors), 3, true)
  );

  const material = new THREE.LineBasicMaterial({
    vertexColors: true,
    // color: "red",
    side: THREE.DoubleSide,
  });
  const flyLine = new THREE.Line(lineGeometry, material);

  return { flyLine, flySpot };
};
