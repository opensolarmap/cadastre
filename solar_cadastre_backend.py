# Usage :
# uwsgi --http :9090 --wsgi-file solar_cadastre_backend.py --callable application

import falcon
import psycopg2
import postgis
import json
import numpy as np
import os

departement_stats_filename = 'departement_stats.geojson'


def limit_range(x_min, x_max, y_min, y_max, x_gap_max, y_gap_max):
    assert x_min <= x_max
    assert y_min <= y_max
    if x_max - x_min > x_gap_max:
        x_mean = (x_min + x_max)/2
        x_min = x_mean - (x_gap_max / 2.)
        x_max = x_mean + (x_gap_max / 2.)
    if y_max - y_min > y_gap_max:
        y_mean = (y_min + y_max)/2
        y_min = y_mean - (y_gap_max / 2.)
        y_max = y_mean + (y_gap_max / 2.)

    return x_min, x_max, y_min, y_max

class VectorRoofs(object):
    def on_get(self, req, resp):
        params = req.params

        try:
            x_min = float(params['x_min'])
            x_max = float(params['x_max'])
            y_min = float(params['y_min'])
            y_max = float(params['y_max'])
        except ValueError:
            resp.status = falcon.HTTP_404
            return

        x_gap_max = 0.5
        y_gap_max = 0.1
        x_min, x_max, y_min, y_max = limit_range(x_min, x_max, y_min, y_max, x_gap_max, y_gap_max)

        connection = psycopg2.connect(dbname='solar', user='solar', password='baba')
        cursor = connection.cursor()
        postgis.register(cursor)

        cursor.execute("""
            select id_osm, geom, class_0, class_1, class_2, class_3
            from buildings
            where geom && st_makeenvelope(%s, %s, %s, %s, 4326);
            """, (x_min,y_min,x_max,y_max))

        data = cursor.fetchall()

        cursor.close()
        connection.close()

        if len(data) != 0:
            id_osm, geom, class_0, class_1, class_2, class_3 = zip(*data)
            probas = np.transpose(np.array([class_0, class_1, class_2, class_3], dtype=np.float))
            unknown_mask = np.isnan(probas).sum(1).astype(np.bool)
            probas_num = np.nan_to_num(probas)
            class_max = np.argmax(probas_num, axis=1)
            class_max_score = np.max(probas_num, axis=1)
            class_max_score
            class_estimation = class_max * (class_max_score > 0.5) - (class_max_score <= 0.5)
            class_estimation[unknown_mask] = -2

        features = []
        for i in range(len(data)):
            features.append({
                    'type': 'Feature',
                    'properties': {
                        'id_osm': id_osm[i],
                        'class_0': probas[i, 0],
                        'class_1': probas[i, 1],
                        'class_2': probas[i, 2],
                        'class_3': probas[i, 3],
                        'class_estimation': int(class_estimation[i]),
                    },
                    'geometry': geom[i].geojson
                })

        resp.status = falcon.HTTP_200
        resp.set_header('Access-Control-Allow-Origin', '*')
        resp.body = json.dumps({
               'type': 'FeatureCollection',
               'features': features,
            })


class CommuneStats(object):
    def on_get(self, req, resp):
        params = req.params

        try:
            x_min = float(params['x_min'])
            x_max = float(params['x_max'])
            y_min = float(params['y_min'])
            y_max = float(params['y_max'])
        except ValueError:
            resp.status = falcon.HTTP_404
            return

        x_gap_max = 1.5
        y_gap_max = 0.5
        x_min, x_max, y_min, y_max = limit_range(x_min, x_max, y_min, y_max, x_gap_max, y_gap_max)

        connection = psycopg2.connect(dbname='solar', user='solar', password='baba')
        cursor = connection.cursor()
        postgis.register(cursor)

        cursor.execute("""
            select commune, class_0_sum, class_1_sum, class_2_sum, class_3_sum, total, nom, wikipedia, surf_m2, geom
            from commune_merge
            where geom && st_makeenvelope(%s, %s, %s, %s, 4326);
            """, (x_min,y_min,x_max,y_max))

        data = cursor.fetchall()

        cursor.close()
        connection.close()

        features = []
        for i, data_commune in enumerate(data):
            features.append({
                    'type': 'Feature',
                    'properties': {
                        'commune': data_commune[0],
                        'class_0_sum': data_commune[1],
                        'class_1_sum': data_commune[2],
                        'class_2_sum': data_commune[3],
                        'class_3_sum': data_commune[4],
                        'total': data_commune[5],
                        'nom': data_commune[6],
                        'wikipedia': data_commune[7],
                        'surf_m2': float(data_commune[8]),
                    },
                    'geometry': data_commune[9].geojson
                })

        resp.status = falcon.HTTP_200
        resp.set_header('Access-Control-Allow-Origin', '*')
        resp.body = json.dumps({
               'type': 'FeatureCollection',
               'features': features,
            })


class DepartementStats(object):
    def on_get(self, req, resp):
        if not os.path.isfile(departement_stats_filename):
            connection = psycopg2.connect(dbname='solar', user='solar', password='baba')
            cursor = connection.cursor()
            postgis.register(cursor)

            cursor.execute("""
                select departement, class_0_sum, class_1_sum, class_2_sum, class_3_sum, total, nom, nuts3, wikipedia, geom
                from departement_merge;
                """)

            data = cursor.fetchall()

            cursor.close()
            connection.close()

            features = []
            for i, data_departement in enumerate(data):
                geom = data_departement[9]
                if not geom:
                    continue
                features.append({
                        'type': 'Feature',
                        'properties': {
                            'departement': data_departement[0],
                            'class_0_sum': data_departement[1],
                            'class_1_sum': data_departement[2],
                            'class_2_sum': data_departement[3],
                            'class_3_sum': data_departement[4],
                            'total': data_departement[5],
                            'nom': data_departement[6],
                            'nuts3': data_departement[7],
                            'wikipedia': data_departement[8],
                        },
                        'geometry': geom.geojson
                    })

            content = json.dumps({
                'type': 'FeatureCollection',
                'features': features,
                })

            with open(departement_stats_filename ,'w') as f:
                f.write(content)

        with open(departement_stats_filename ,'r') as f:
            content = f.read()

        resp.status = falcon.HTTP_200
        resp.set_header('Access-Control-Allow-Origin', '*')
        resp.body = content


application = falcon.API()

vector_roofs = VectorRoofs()
commune_stats = CommuneStats()
departement_stats = DepartementStats()

application.add_route('/vector_roofs', vector_roofs)
application.add_route('/commune_stats', commune_stats)
application.add_route('/departement_stats', departement_stats)

# example : http://localhost:9090/vector_roofs?x_min=2.33834981918335&x_max=2.3512244224548344&y_min=48.84692582192718&y_max=48.85257378928073
# example : http://localhost:9090/commune_stats?x_min=2.35&x_max=2.65&y_min=48.85&y_max=48.95
# example : http://localhost:9090/departement_stats

