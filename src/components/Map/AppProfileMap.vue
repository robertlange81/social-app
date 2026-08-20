<template><div ref="mapRoot" class="profile-map" aria-label="Karte mit Profilen"></div></template>
<script>
import Map from 'ol/Map'
import View from 'ol/View'
import TileLayer from 'ol/layer/Tile'
import VectorLayer from 'ol/layer/Vector'
import OSM from 'ol/source/OSM'
import VectorSource from 'ol/source/Vector'
import Cluster from 'ol/source/Cluster'
import Feature from 'ol/Feature'
import Point from 'ol/geom/Point'
import { fromLonLat } from 'ol/proj'
import { boundingExtent } from 'ol/extent'
import { Circle as CircleStyle, Fill, Stroke, Style, Text } from 'ol/style'
import 'ol/ol.css'

export default {
  props: { profiles: { type: Array, default: () => [] }, myLocation: { type: Object, default: null } },
  data: () => ({ map: null, source: null, clusterSource: null }),
  mounted () {
    this.source = new VectorSource()
    this.clusterSource = new Cluster({ distance: 44, source: this.source })
    const clusterLayer = new VectorLayer({ source: this.clusterSource, style: feature => { const size = feature.get('features').length; return new Style({ image: new CircleStyle({ radius: size > 1 ? Math.min(22, 11 + size) : 10, fill: new Fill({ color: size > 1 ? '#168890' : '#32BCC3' }), stroke: new Stroke({ color: '#fff', width: 3 }) }), text: size > 1 ? new Text({ text: String(size), fill: new Fill({ color: '#fff' }), font: 'bold 12px sans-serif' }) : undefined }) } })
    this.map = new Map({ target: this.$refs.mapRoot, layers: [new TileLayer({ source: new OSM() }), clusterLayer], view: new View({ center: fromLonLat([10.45, 51.16]), zoom: 6 }) })
    this.map.on('click', event => { const cluster = this.map.forEachFeatureAtPixel(event.pixel, item => item); if (!cluster) return; const features = cluster.get('features') || []; if (features.length > 1) { const extent = boundingExtent(features.map(item => item.getGeometry().getCoordinates())); this.map.getView().fit(extent, { padding: [80, 80, 80, 80], maxZoom: 14, duration: 300 }) } else if (features[0] && features[0].get('profile')) this.$emit('select', features[0].get('profile')) })
    this.map.on('pointermove', event => { this.map.getTargetElement().style.cursor = this.map.hasFeatureAtPixel(event.pixel) ? 'pointer' : '' })
    this.renderMarkers()
  },
  beforeDestroy () { if (this.map) this.map.setTarget(null) },
  watch: { profiles: { deep: true, handler () { this.renderMarkers() } }, myLocation: { deep: true, handler () { this.renderMarkers() } } },
  methods: {
    renderMarkers () {
      if (!this.source) return
      this.source.clear(); const coordinates = []
      if (this.myLocation) {
        const mine = fromLonLat([this.myLocation.longitude, this.myLocation.latitude]); coordinates.push(mine)
        const ownFeature = new Feature({ geometry: new Point(mine) })
        this.source.addFeature(ownFeature)
      }
      this.profiles.forEach(profile => {
        if (!profile.location) return
        const coordinate = fromLonLat([profile.location.longitude, profile.location.latitude]); coordinates.push(coordinate)
        const feature = new Feature({ geometry: new Point(coordinate), profile })
        this.source.addFeature(feature)
      })
      if (coordinates.length === 1) { this.map.getView().setCenter(coordinates[0]); this.map.getView().setZoom(11) } else if (coordinates.length > 1) this.map.getView().fit(boundingExtent(coordinates), { padding: [50, 50, 50, 50], maxZoom: 11, duration: 300 })
    }
  }
}
</script>
<style scoped>.profile-map { width: 100%; height: 62vh; min-height: 420px; border-radius: 8px; overflow: hidden; }</style>
