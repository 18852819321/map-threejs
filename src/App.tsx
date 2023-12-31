import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import Map3D, { ProjectionFnParamType } from "./map3d";
import { GeoJsonType } from "./map3d/typed";
import './map3d/index.css';

// 地图放大倍率
const MapScale: any = {
  country: 55,
  province: 100,
  city: 200,
  district: 300,
};

function App() {
  const [geoJson, setGeoJson] = useState<GeoJsonType>();
  const [mapAdCode, setMapAdCode] = useState<number>(100000);
  const [projectionFnParam, setProjectionFnParam] =
    useState<ProjectionFnParamType>({
      center: [107.0, 35.5],
      scale: 55,
    });

  useEffect(() => {
    queryMapData(mapAdCode); // 默认的中国adcode码
  }, [mapAdCode]);

  // 请求地图数据
  const queryMapData = useCallback(async (code: number) => {
    const response = await axios.get(
      `https://geo.datav.aliyun.com/areas_v3/bound/${code}_full.json`
    );
    const { data } = response;
    setGeoJson(data);
  }, []);

  // 双击事件
  const dblClickFn = (customProperties: any) => {
    console.log(customProperties)
    setMapAdCode(customProperties.adcode);
    setProjectionFnParam({
      center: customProperties.centroid,
      scale: MapScale[customProperties.level],
    });
  };

  return (
    <>
      {geoJson && (
        <Map3D
          geoJson={geoJson}
          dblClickFn={dblClickFn}
          projectionFnParam={projectionFnParam}
        />
      )}
    </>
  );
}

export default App;
