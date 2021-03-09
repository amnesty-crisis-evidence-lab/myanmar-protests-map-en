import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "./Map.css";
import { geojson } from "./data";

mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;

const Map = () => {
  const [map, setMap] = useState(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const initialiseMap = ({ setMap, containerRef }) => {
      const map = new mapboxgl.Map({
        container: containerRef.current,
        style: "mapbox://styles/amnestydecoders/ckjy6y3ll2ha317pjtsmwqne4",
        center: [35.8481945, 33.8841665],
        zoom: 5,
        minZoom: 5,
        maxZoom: 16,
        scrollZoom: false
      });

      map.on("load", () => {
        map.fitBounds(
          [
            [35.4832837, 33.878763],
            [35.5097186, 33.898162]
          ],
          { padding: 80 }
        );

        map.addSource("arms", {
          type: "geojson",
          data: geojson,
          cluster: true,
          clusterMaxZoom: 14,
          clusterRadius: 50
        });

        map.addLayer({
          id: "clusters",
          type: "circle",
          source: "arms",
          filter: ["has", "point_count"],
          paint: {
            "circle-color": "#ffff00",
            "circle-radius": [
              "step",
              ["get", "point_count"],
              20,
              10,
              30,
              50,
              40
            ],
            "circle-opacity": 0.8,
            "circle-stroke-width": 1,
            "circle-stroke-color": "#ffff00"
          }
        });

        map.addLayer({
          id: "cluster-count",
          type: "symbol",
          source: "arms",
          filter: ["has", "point_count"],
          layout: {
            "text-field": "{point_count_abbreviated}",
            "text-font": [
              "Amnesty Trade Gothic Bold No- 2",
              "Arial Unicode MS Bold"
            ],
            "text-size": 12
          }
        });

        map.addLayer({
          id: "unclustered-point",
          type: "circle",
          source: "arms",
          filter: ["!", ["has", "point_count"]],
          paint: {
            "circle-color": "#ffff00",
            "circle-radius": 6,
            "circle-opacity": 0.8,
            "circle-stroke-width": 1,
            "circle-stroke-color": "#ffffff"
          }
        });

        // Inspect a cluster on click
        map.on("click", "clusters", e => {
          const { properties, geometry } = map.queryRenderedFeatures(e.point, {
            layers: ["clusters"]
          })[0];
          const { cluster_id: clusterId } = properties;

          map
            .getSource("arms")
            .getClusterExpansionZoom(clusterId, (err, zoom) => {
              if (err) return;

              map.easeTo({
                center: geometry.coordinates,
                zoom
              });
            });
        });

        map.on("click", "unclustered-point", e => {
          const { geometry, properties } = e.features[0];
          const coordinates = geometry.coordinates.slice();
          const {
            event_date: eventDate,
            longitude,
            latitude,
            tooltip
          } = properties;

          // Ensure that if the map is zoomed out such that multiple copies of the
          // feature are visible, the popup appears over the copy being pointed
          // to.
          while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
            coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
          }

          new mapboxgl.Popup()
            .setLngLat(coordinates)
            .setHTML(
              `<strong>Event date:</strong> ${eventDate}<br><strong>Arms type:</strong> ${tooltip}<br><strong>Longitude:</strong> ${longitude.toFixed(
                4
              )}<br><strong>Latitude:</strong> ${latitude.toFixed(4)}`
            )
            .addTo(map);
        });

        map.on("mouseenter", "clusters", () => {
          map.getCanvas().style.cursor = "pointer";
        });

        map.on("mouseleave", "clusters", () => {
          map.getCanvas().style.cursor = "";
        });

        map.on("mouseenter", "unclustered-point", () => {
          map.getCanvas().style.cursor = "pointer";
        });

        map.on("mouseleave", "unclustered-point", () => {
          map.getCanvas().style.cursor = "";
        });

        map.on("move", () => {
          setMap(map);
        });

        map.addControl(new mapboxgl.NavigationControl());
      });

      setMap(map);

      map.resize();
    };

    if (!map) initialiseMap({ setMap, containerRef });
  }, [map]);

  return <div className="map__container" ref={containerRef} />;
};

export default Map;
