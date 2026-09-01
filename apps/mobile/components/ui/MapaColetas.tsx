import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";
import * as Location from "expo-location";
import { colors, radius } from "@/theme/tokens";

export interface MapaColetaItem {
  id: number;
  titulo: string;
  materialNome: string;
  quantidade: string;
  endereco: string;
  imagemUrl?: string | null;
}

type UserLoc = { lat: number; lon: number } | null;

/**
 * Reproduz o mapa da versão web (Leaflet + OpenStreetMap + geocodificação
 * Nominatim) dentro de um WebView. Quando a localização do dispositivo está
 * disponível, o mapa é centralizado nela; caso contrário, ajusta o
 * enquadramento aos marcadores das coletas.
 */
function buildHtml(items: MapaColetaItem[], userLoc: UserLoc) {
  const itemsJson = JSON.stringify(items);
  const userJson = userLoc ? JSON.stringify(userLoc) : "null";
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  html, body, #map { margin:0; padding:0; height:100%; width:100%; }
  body { background:#F1F5F0; -webkit-tap-highlight-color: transparent; }
  .leaflet-container { font-family: -apple-system, Roboto, "Segoe UI", sans-serif; }
  .leaflet-popup-content-wrapper { border-radius:10px; }
  .leaflet-popup-content { margin:.6rem .8rem; }
</style>
</head>
<body>
<div id="map"></div>
<script>
  var ITEMS = ${itemsJson};
  var USER = ${userJson};
  var CACHE_PREFIX = "geo:v1:";
  function esc(s){ return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }
  function materialVisual(nome){
    var v=(nome||"").toLowerCase();
    if(v.indexOf("papel")>-1||v.indexOf("papelao")>-1||v.indexOf("papelão")>-1||v.indexOf("cartao")>-1) return {color:"#A3A05B",emoji:"📄"};
    if(v.indexOf("plast")>-1||v.indexOf("pet")>-1) return {color:"#3B82F6",emoji:"🧴"};
    if(v.indexOf("metal")>-1||v.indexOf("alumin")>-1||v.indexOf("lata")>-1) return {color:"#6B7280",emoji:"🥫"};
    if(v.indexOf("vidro")>-1) return {color:"#10B981",emoji:"🍾"};
    if(v.indexOf("eletr")>-1||v.indexOf("e-lixo")>-1) return {color:"#8B5CF6",emoji:"🔌"};
    if(v.indexOf("organ")>-1||v.indexOf("compost")>-1) return {color:"#84CC16",emoji:"🍃"};
    if(v.indexOf("oleo")>-1||v.indexOf("óleo")>-1) return {color:"#D97706",emoji:"🛢️"};
    if(v.indexOf("text")>-1||v.indexOf("roupa")>-1||v.indexOf("tecido")>-1) return {color:"#EC4899",emoji:"🧵"};
    if(v.indexOf("madeira")>-1) return {color:"#92400E",emoji:"🪵"};
    if(v.indexOf("borracha")>-1||v.indexOf("pneu")>-1) return {color:"#334155",emoji:"🛞"};
    return {color:"#2F8D47",emoji:"♻️"};
  }
  function lerCache(e){ try{ var raw=localStorage.getItem(CACHE_PREFIX+e); if(raw===null) return undefined; return JSON.parse(raw);}catch(x){return undefined;} }
  function gravarCache(e,p){ try{ localStorage.setItem(CACHE_PREFIX+e, JSON.stringify(p)); }catch(x){} }
  function wait(ms){ return new Promise(function(r){ setTimeout(r,ms); }); }
  function geocodificar(endereco){
    var base="https://nominatim.openstreetmap.org/search";
    var tents=[endereco, endereco.replace(/,?\\s*\\d{5}-?\\d{3}/,"").trim(), endereco.split(",").slice(0,2).join(",").trim(), endereco.split(",").slice(-2).join(",").trim()];
    var seen={}; var lista=[];
    for(var i=0;i<tents.length;i++){ var t=tents[i]; if(t && !seen[t]){ seen[t]=1; lista.push(t);} }
    return (function loop(idx){
      if(idx>=lista.length) return Promise.resolve(null);
      var q=encodeURIComponent(lista[idx]);
      return fetch(base+"?q="+q+"&format=json&limit=1&countrycodes=br", { headers:{"Accept-Language":"pt-BR"} })
        .then(function(r){ return r.json(); })
        .then(function(data){ if(Array.isArray(data)&&data.length>0){ return {lat:parseFloat(data[0].lat),lon:parseFloat(data[0].lon)}; } return loop(idx+1); })
        .catch(function(){ return loop(idx+1); });
    })(0);
  }

  var map = L.map("map", { zoomControl:true, scrollWheelZoom:false })
    .setView(USER ? [USER.lat, USER.lon] : [-14.235,-51.925], USER ? 13 : 4);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution:"&copy; OpenStreetMap", maxZoom:19 }).addTo(map);
  setTimeout(function(){ map.invalidateSize(); },120);

  if(USER){
    L.circleMarker([USER.lat, USER.lon], { radius:8, color:"#1B4332", weight:3, fillColor:"#2D6A4F", fillOpacity:1 })
      .addTo(map).bindPopup("Você está aqui");
  }

  var grupo=[];
  (async function(){
    for(var i=0;i<ITEMS.length;i++){
      var item=ITEMS[i];
      var ponto=lerCache(item.endereco);
      if(ponto===undefined){ ponto=await geocodificar(item.endereco); gravarCache(item.endereco,ponto); await wait(1100); }
      if(ponto){
        var vis=materialVisual(item.materialNome);
        var icon=L.divIcon({ className:"", html:'<div style="position:relative;width:34px;height:34px"><div style="width:34px;height:34px;border-radius:50% 50% 50% 0;background:'+vis.color+';border:3px solid #fff;transform:rotate(-45deg);box-shadow:0 2px 8px rgba(0,0,0,.35)"></div><span style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:16px;line-height:1">'+vis.emoji+'</span></div>', iconSize:[34,34], iconAnchor:[17,34] });
        var imagemHtml = item.imagemUrl ? '<img src="'+esc(item.imagemUrl)+'" alt="" style="width:100%;height:110px;object-fit:cover;border-radius:8px;margin-bottom:6px;display:block" />' : '';
        var popup = '<div style="min-width:180px;max-width:210px">'+imagemHtml+'<strong style="font-size:13px">'+esc(item.titulo)+'</strong><div style="font-size:12px;color:#555;margin-top:2px">'+vis.emoji+' '+esc(item.materialNome)+' · '+esc(item.quantidade)+'</div><div style="font-size:11px;color:#777;margin-top:4px">'+esc(item.endereco)+'</div></div>';
        var marker=L.marker([ponto.lat,ponto.lon],{icon:icon}).addTo(map).bindPopup(popup);
        grupo.push(marker);
        // Sem localização do usuário: ajusta o enquadramento aos marcadores.
        if(!USER){
          var bounds=L.featureGroup(grupo).getBounds();
          if(bounds.isValid()){ map.fitBounds(bounds.pad(0.25),{maxZoom:15}); }
        }
      }
    }
  })();
</script>
</body>
</html>`;
}

export function MapaColetas({
  items,
  height = 300,
  centerOnUser = true,
}: {
  items: MapaColetaItem[];
  height?: number;
  /** true: centraliza na localização do dispositivo; false: enquadra nos marcadores. */
  centerOnUser?: boolean;
}) {
  const [userLoc, setUserLoc] = useState<UserLoc>(null);
  const [locResolved, setLocResolved] = useState(false);
  const resolvedRef = useRef(false);

  useEffect(() => {
    // Sem centralização no usuário: pula a geolocalização (e o prompt de permissão)
    // e deixa o mapa enquadrar direto nos marcadores.
    if (!centerOnUser) {
      setLocResolved(true);
      return;
    }

    let active = true;

    // Resolve a localização uma única vez (evita recarregar o WebView).
    const resolve = (loc: UserLoc) => {
      if (!active || resolvedRef.current) return;
      resolvedRef.current = true;
      if (loc) setUserLoc(loc);
      setLocResolved(true);
    };

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") return resolve(null);

        const last = await Location.getLastKnownPositionAsync();
        if (last)
          return resolve({
            lat: last.coords.latitude,
            lon: last.coords.longitude,
          });

        const cur = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        resolve({ lat: cur.coords.latitude, lon: cur.coords.longitude });
      } catch {
        resolve(null);
      }
    })();

    // Rede/GPS lentos não devem travar o mapa: cai no enquadramento padrão.
    const timeout = setTimeout(() => resolve(null), 6000);

    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [centerOnUser]);

  const html = useMemo(
    () => buildHtml(items, userLoc),
    [items, userLoc]
  );
  const webviewKey = useMemo(
    () => `${items.map((i) => i.id).join("-")}:${userLoc ? "u" : "n"}`,
    [items, userLoc]
  );

  if (items.length === 0) return null;

  return (
    <View style={[styles.mapBox, { height }]}>
      {locResolved ? (
        <WebView
          key={webviewKey}
          originWhitelist={["*"]}
          source={{ html }}
          domStorageEnabled
          javaScriptEnabled
          nestedScrollEnabled
          startInLoadingState
          renderLoading={() => (
            <View style={styles.loading}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          )}
          style={styles.webview}
        />
      ) : (
        <View style={styles.loading}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  mapBox: {
    borderRadius: radius.sm,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.stroke,
    backgroundColor: colors.canvasMuted,
  },
  webview: {
    flex: 1,
    backgroundColor: "transparent",
  },
  loading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.canvasMuted,
  },
});
