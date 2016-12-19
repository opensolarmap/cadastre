
// config

token = 'pk.eyJ1Ijoib3BlbnN0cmVldG1hcCIsImEiOiJncjlmd0t3In0.DmZsIeOW-3x-C5eX-wAqTw'
backend_server = 'http://localhost:9090'


// map and base maps

var layerLight = L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=' + token, {
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
    '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
    'Imagery © <a href="http://mapbox.com">Mapbox</a>',
    id: 'mapbox.light'
});
var layerPhoto = L.tileLayer('http://{s}.tiles.mapbox.com/v4/openstreetmap.map-inh7ifmo/{z}/{x}/{y}.png?access_token=' + token, {
    maxZoom: 18,
    attribution: 'Imagery &copy; <a href="https://www.mapbox.com/satellite/">Mapbox/DigitalGlobe</a> - ' +
    'Map data &copy; <a href="http://osm.org/copyright">OpenStreetMap contributors',
});

var baseMaps = {
    "Carte": layerLight,
    "Image satellite": layerPhoto
};

var map = L.map('map', {
    zoomControl: false,
    maxZoom: 19,
    minZoom: 3,
    layers: [layerLight]
}).setView([47., 2.35], 6);

L.control.layers(baseMaps).addTo(map);


// buildings layer

var buildingLayer = null;

function buildingColor(c) {
    return c == 0 ? '#ff6600' :
        c == 1 ? '#3399ff' :
            c == 2 ? '#33cc33' :
                c == 3 ? '#999977' :
                    c == -1 ? '#e6e6e6' :
                        c == -2 ? '#e6e6e6' :
                            '#ff0000';
}

function buildingBoundaryColor(c) {
    return c == 0 ? '#993d00' :
        c == 1 ? '#0066cc' :
            c == 2 ? '#1f7a1f' :
                c == 3 ? '#66664d' :
                    c == -1 ? '#b3b3b3' :
                        c == -2 ? '#b3b3b3' :
                            '#990000';
}

function buildingStyle(feature) {
    return {
        fillColor: buildingColor(feature.properties.class_estimation),
        weight: 1,
        opacity: 1,
        color: buildingBoundaryColor(feature.properties.class_estimation),
        //dashArray: '3',
        fillOpacity: 0.6
    };
}

function buildingHighlight(e) {
    var layer = e.target;

    layer.setStyle({
        weight: 5,
        color: '#666',
        dashArray: '',
        fillOpacity: 0.7
    });

    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
        layer.bringToFront();
    }

    info.update(layer.feature.properties);
}

function buildingResetHighlight(e) {
    buildingLayer.resetStyle(e.target);
    info.update();
}

function buildingOnEachFeature(feature, layer) {
    layer.on({
        mouseover: buildingHighlight,
        mouseout: buildingResetHighlight,
    });
}

function gotBuildings(error, buildings) {
    newLayer = L.geoJson(buildings, {
        style: buildingStyle,
        onEachFeature: buildingOnEachFeature
    }).addTo(map);

    clearDataLayers();
    buildingLayer = newLayer;
}


// communes layer

var communeLayer = null;

function communeColor(c0, c1, c2, c3, tot) {
    if (c0 + c1 == 0) {
        return '#777777'
    }

    ratio = c1 / (c0 + c1);
    ratio_amplified = ((ratio - 0.5) * 1.5) + 0.5;
    ratio_bounded = Math.min(Math.max(ratio_amplified, 0), 1);
    ratio_240 = Math.floor(ratio_bounded * 240)
    return 'hsl(' + ratio_240 + ',100%,50%)'
}

function communeBoundaryColor(c0, c1, c2, c3, tot) {
    if (c0 + c1 == 0) {
        return '#555555'
    }

    ratio = c1 / (c0 + c1);
    ratio_amplified = ((ratio - 0.5) * 1.5) + 0.5;
    ratio_bounded = Math.min(Math.max(ratio_amplified, 0), 1);
    ratio_240 = Math.floor(ratio_bounded * 240)
    return 'hsl(' + ratio_240 + ',100%,25%)'
}

function communeStyle(feature) {
    return {
        fillColor: communeColor(
            feature.properties.class_0_sum,
            feature.properties.class_1_sum,
            feature.properties.class_2_sum,
            feature.properties.class_3_sum,
            feature.properties.total
        ),
        weight: 1,
        opacity: 1,
        color: communeBoundaryColor(
            feature.properties.class_0_sum,
            feature.properties.class_1_sum,
            feature.properties.class_2_sum,
            feature.properties.class_3_sum,
            feature.properties.total
        ),
        //dashArray: '3',
        fillOpacity: 0.4
    };
}

function communeHighlight(e) {
    var layer = e.target;

    layer.setStyle({
        weight: 5,
        color: '#666',
        dashArray: '',
        fillOpacity: 0.7
    });

    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
        layer.bringToFront();
    }

    info.update(layer.feature.properties);
}

function communeResetHighlight(e) {
    communeLayer.resetStyle(e.target);
    info.update();
}

function communeOnEachFeature(feature, layer) {
    layer.on({
        mouseover: communeHighlight,
        mouseout: communeResetHighlight,
    });
}

function gotCommunes(error, communes) {
    newLayer = L.geoJson(communes, {
        style: communeStyle,
        onEachFeature: communeOnEachFeature
    }).addTo(map);

    clearDataLayers();
    communeLayer = newLayer;
}


// departements layer

var departementLayer = null;

function departementColor(c0, c1, c2, c3, tot) {
    if (c0 + c1 == 0) {
        return '#777777'
    }

    ratio = c1 / (c0 + c1);
    ratio_amplified = ((ratio - 0.5) * 3) + 0.5;
    ratio_bounded = Math.min(Math.max(ratio_amplified, 0), 1);
    ratio_240 = Math.floor(ratio_bounded * 240)
    return 'hsl(' + ratio_240 + ',100%,50%)'
}

function departementBoundaryColor(c0, c1, c2, c3, tot) {
    if (c0 + c1 == 0) {
        return '#555555'
    }

    ratio = c1 / (c0 + c1);
    ratio_amplified = ((ratio - 0.5) * 3) + 0.5;
    ratio_bounded = Math.min(Math.max(ratio_amplified, 0), 1);
    ratio_240 = Math.floor(ratio_bounded * 240)
    return 'hsl(' + ratio_240 + ',100%,25%)'
}

function departementStyle(feature) {
    return {
        fillColor: departementColor(
            feature.properties.class_0_sum,
            feature.properties.class_1_sum,
            feature.properties.class_2_sum,
            feature.properties.class_3_sum,
            feature.properties.total
        ),
        weight: 1,
        opacity: 1,
        color: departementBoundaryColor(
            feature.properties.class_0_sum,
            feature.properties.class_1_sum,
            feature.properties.class_2_sum,
            feature.properties.class_3_sum,
            feature.properties.total
        ),
        //dashArray: '3',
        fillOpacity: 0.4
    };
}

function departementHighlight(e) {
    var layer = e.target;

    layer.setStyle({
        weight: 5,
        color: '#666',
        dashArray: '',
        fillOpacity: 0.7
    });

    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
        layer.bringToFront();
    }

    info.update(layer.feature.properties);
}

function departementResetHighlight(e) {
    departementLayer.resetStyle(e.target);
    info.update();
}

function departementOnEachFeature(feature, layer) {
    layer.on({
        mouseover: departementHighlight,
        mouseout: departementResetHighlight,
    });
}

function displayDepartements() {
    if (!departementLayer) {    // departement layer is not yet loaded
        return
    }
    if (!map.hasLayer(departementLayer)) {
        clearDataLayers();
        map.addLayer(departementLayer);
    }
}

function gotDepartements(error, departements) {
    departementLayer = L.geoJson(departements, {
        style: departementStyle,
        onEachFeature: departementOnEachFeature
    });

    displayDepartements();
}

d3.json(backend_server + '/departement_stats', gotDepartements)


// zoom behavior

function clearDataLayers() {
    if (buildingLayer) {
        map.removeLayer(buildingLayer);
        buildingLayer = null;
    }
    if (communeLayer) {
        map.removeLayer(communeLayer);
        communeLayer = null;
    }
    if (map.hasLayer(departementLayer)) {
        map.removeLayer(departementLayer);
    }
}


function mapChanged(e) {
    zoom_level = map.getZoom();
    if (zoom_level < 11) {
        displayDepartements()
    } else {
        bounds = map.getBounds();
        east = bounds.getEast();
        west = bounds.getWest();
        north = bounds.getNorth();
        south = bounds.getSouth();

        if (zoom_level >= 15) {
            url = backend_server + '/vector_roofs?x_min=' + west + '&x_max=' + east + '&y_min=' + south + '&y_max=' + north
            callback = gotBuildings
        } else {
            url = backend_server + '/commune_stats?x_min=' + west + '&x_max=' + east + '&y_min=' + south + '&y_max=' + north
            callback = gotCommunes
        }

        d3.json(url, callback)
    }
}


// information control

var info = L.control();

info.onAdd = function (map) {
    this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
    this.update();
    return this._div;
};

info.update = function (props) {
    if (!props) {
        this._div.style.visibility = 'hidden';
        return
    }


    if ('id_osm' in props) {
        innerHTML = '<h4>Informations</h4>';
        innerHTML += '<b>';
        innerHTML += props.class_estimation == 0 ? 'Toit avec orientation sud/nord' :
                props.class_estimation == 1 ? 'Toit avec orientation est/ouest' :
                props.class_estimation == 2 ? 'Toit plat' :
                props.class_estimation == 3 ? 'Toit complexe' :
                props.class_estimation == -1 ? 'Indécis' :
                props.class_estimation == -2 ? 'Pas encore calculé' :
                                               'Code inconnu';

        innerHTML += '</b></br>';
        innerHTML += 'Identifiant OpenStreetMap : ' + props.id_osm + '</br>';
        innerHTML += 'Probabilités estimées : </br>';
        innerHTML += '\t- orientation sud/nord : ' + props.class_0 + '</br>'; 
        innerHTML += '\t- orientation est/ouest : ' + props.class_1 + '</br>'; 
        innerHTML += '\t- toit plat : ' + props.class_2 + '</br>' ;
        innerHTML += '\t- toit complexe : ' + props.class_3 + '</br>'; 

    } else if ('commune' in props) {
        innerHTML = '<h4>' + props.nom + '</h4>';

        innerHTML += 'Code INSEE : ' + props.commune + '</br>';
        innerHTML += '' + (props.total || 0) + ' toits classifiés dont :</br>'; 
        innerHTML += '\t- orientation sud/nord : ' + (props.class_0_sum || 0) + '</br>'; 
        innerHTML += '\t- orientation est/ouest : ' + (props.class_1_sum || 0) + '</br>';
        innerHTML += '\t- toit plat : ' + (props.class_2_sum || 0) + '</br>';
        innerHTML += '\t- toit complexe : ' + (props.class_3_sum || 0) + '</br>'; 
    } else if ('departement' in props) {
        innerHTML = '<h4>' + props.nom + '</h4>';

        innerHTML += 'Code INSEE : ' + props.departement + '</br>';
        innerHTML += '' + (props.total || 0) + ' toits classifiés dont :</br>'; 
        innerHTML += '\t- orientation sud/nord : ' + (props.class_0_sum || 0) + '</br>'; 
        innerHTML += '\t- orientation est/ouest : ' + (props.class_1_sum || 0) + '</br>'; 
        innerHTML += '\t- toit plat : ' + (props.class_2_sum || 0) + '</br>';
        innerHTML += '\t- toit complexe : ' + (props.class_3_sum || 0) + '</br>'; 
    } else {
        this._div.style.visibility = 'hidden';
        return
    }


    this._div.innerHTML = innerHTML
    this._div.style.visibility = 'visible';
};

info.addTo(map);


// set event listeners

map.on('moveend', mapChanged);


