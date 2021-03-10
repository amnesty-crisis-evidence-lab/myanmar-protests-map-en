import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "./Map.css";
import { geojson } from "./data";

const highlights = [
  "MMR034",
  "MMR077",
  "MMR078",
  "MMR005",
  "MMR076",
  "MMR045",
  "MMR009",
  "MMR026"
];

mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;

const Map = () => {
  const [map, setMap] = useState(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const initialiseMap = ({ setMap, containerRef }) => {
      const map = new mapboxgl.Map({
        container: containerRef.current,
        style: "mapbox://styles/amnestydecoders/ckm1071uf3jsd17r1ylzcy1tk",
        bounds: [
          [91.833, 6],
          [102, 28.35]
        ],
        fitBoundsOptions: { padding: 20 },
        scrollZoom: false
      });

      map.on("load", () => {
        map.setMinZoom(map.getZoom());

        map.addSource("events", {
          type: "geojson",
          data: geojson,
          cluster: true,
          clusterMaxZoom: 14,
          clusterRadius: 50
        });

        map.addLayer({
          id: "clusters",
          type: "circle",
          source: "events",
          filter: ["has", "point_count"],
          paint: {
            "circle-color": "#ffff00",
            "circle-radius": [
              "step",
              ["get", "point_count"],
              20,
              10,
              30,
              20,
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
          source: "events",
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
          source: "events",
          filter: ["!", ["has", "point_count"]],
          paint: {
            "circle-color": [
              "case",
              ["in", ["get", "content_code"], ["literal", highlights]],
              "#de2209",
              "#ffff00"
            ],
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
            .getSource("events")
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
            source_link1: sourceLink1,
            source_link2: sourceLink2,
            source_link3: sourceLink3,
            graphic,
            event_date: eventDate,
            latitude,
            longitude,
            tooltip,
            events_no: eventsNo
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
              `<strong>Event(s) date:</strong> ${eventDate}<br><strong>Event(s) type:</strong> ${tooltip}<br><strong>Longitude:</strong> ${longitude.toFixed(
                4
              )}<br><strong>Latitude:</strong> ${latitude.toFixed(4)}<br>` +
                `${
                  eventsNo > 0
                    ? `<strong>Number of events: </strong>${eventsNo}<br>`
                    : ""
                }` +
                `<strong>Source(s): </strong><a href=${sourceLink1} target="_blank" />${sourceLink1}</a>` +
                `${
                  sourceLink2 !== "null"
                    ? `;<br><a href=${sourceLink2} target="_blank" />${sourceLink2}</a>`
                    : ""
                }` +
                `${
                  sourceLink3 !== "null"
                    ? `;<br><a href=${sourceLink3} target="_blank" />${sourceLink3}</a>`
                    : ""
                }` +
                `${
                  graphic
                    ? "<br>WARNING - GRAPHIC CONTENT: You may find some videos distressing"
                    : ""
                }`
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
