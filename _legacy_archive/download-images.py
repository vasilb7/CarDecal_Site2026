import os
import urllib.request
import ssl

target_dir = 'e:/Antigravity/CarDecal3/public/Site_Pics/Decals/5cm'
os.makedirs(target_dir, exist_ok=True)

images = {
  "5cm-01": "https://lh3.googleusercontent.com/sitesv/APaQ0SRSDJNSNl95HoEa7pqS5tDFaBEXWLGY3USCsShuLCH2AcVHTh6M3mFoIIly8vOLqtpUpljRoxSVK0YNeisZ9Sf0lbZXfoT97HCr6BwuJh3MzN8H-0wJCMbZmYTzi2KcR5cM6DDChUf1WBi_TZL8dogOZ50gMy1ECpFGixb-wfRD7ArMHFiimAw1-XRQFB6r3vbz9cqMp9QAy77xoUlvzfwZ2XNF-1VzeOzJ-bw=w1280",
  "5cm-02": "https://lh3.googleusercontent.com/sitesv/APaQ0ST0azTOvnNJrOJbNzUFWWhfL_AkwFFkO1i-WLhBabFLaTmJE_Y-v8y7rvHxztcd7QiVE2j3NKfGLOpHZtZpMFUzOFw9z7AQ1n7Y-ep7Z4PgCzPVmh_85GK5iIAu-UctPE_ivWrqyvx3RIMRFGrPRH4vo4CR2CwRsRabV6g89MtjabkwBt-0p2DcZBENNceawQrMttPM-S5RAutAN-IBudOVKnSti2m18e85Pd4=w1280",
  "5cm-03": "https://lh3.googleusercontent.com/sitesv/APaQ0SRnBlwDHIhzE-CpK4Qi94StT4V3Jr09htyNHdzR0oSGRn5fbsgzfx5MlMp8b0woz7pawLW-iZBFhEP0hFGARD7wy2EURmw6G1vNc4rJJEE_tbJJQjFx2RHcKDMcgIcWxKnHuIcYmlY_9Kl6OGkbGgoTiJN3x5iSIeEq_c4f_98eQ1cLV4vHTBzcE6TaoKirOGj-xOSCDYBBg8h40Sh23VL6WQ0NR_zl0fP8=w1280",
  "5x33-04": "https://lh3.googleusercontent.com/sitesv/APaQ0SSZtBdKOI2OuZvAO4PaBYlUqE9EpSA8ZGPQrEarfKCgF-70ID4IV82hC2ie5nGB6nTwBCZGZBmJ8wRlZrVBwofKXVLZBsj5tgWvrnWDnXWcSr2kv2ZKyAEf4YuThzwfANiDtZXEpofBxnFnpUHCDLiMrzJYSdXpHzYvWwjOoS0mED52mtOVUtski9fvGclOGdR4KtWEPREFONqhK7yRlioalM5bsvhE3hyC1Ug=w1280",
  "5cm-05": "https://lh3.googleusercontent.com/sitesv/APaQ0STAABnbmKWvMY1KWVjd9nsn281vLy3zw3d1oIs-9LcrCPiG6qj2wCZkE-gi7omvy7QlxRx4BZO0J_NauxD4SIXxkY640FzibX3ATh2KdMJDdT7lrVH8z2wjIlRee11jqf2UXihlZOoBIEXHB9W9inx6eI6jCM7XzkuZ8rRWbDgjQZY4yTi1tq-XYa3enfjHw6LDKxez2Ji3g8N2Rklyb2HGhdZdm73-s3uuFrs=w1280",
  "5cm-06": "https://lh3.googleusercontent.com/sitesv/APaQ0SS5I6C_SatH60zEQWYrSUkD_T4-LRe-_dTfdVxKLnTu-ngITKX2vfYFOIoHjS6Hkl80jGQgsqGvpN2Q1GSEZ9EvI9tG2YSq6UyDR1rEnRCbOSjO8XwpaYfGXjcTeqOMp53E1tn6qZTcpFXPhkKiv8A_e1BUEOI9GcMkZ_EIXi4-Ow_rlpQbnY-LOTmABJAJmo14rxOYgrPoOG7yQhow_D_c8emZvqn3QmaHZW0=w1280",
  "5cm-07": "https://lh3.googleusercontent.com/sitesv/APaQ0SQA-kLkW0OuvQscKM7NN3vr9nU3fXXAys65T6WWkcu-uFLODCYbtECIj1kwOLdjAOrKF98PHSvtRTJVu_dAecYMQl5H0aib2HeDz1Xlu7S9crbF1dEfItovZn6Il2pwerngVWHSiDgLvGTCv2umdaXacnM2-PgFcmx7xEGaOLv_p9HpBIRTpYuGj7AaFpkNJDijwNh9eUB-3uwS5gaC9P4Ugv9KP5wY8Z6V=w1280",
  "5cm-08": "https://lh3.googleusercontent.com/sitesv/APaQ0STYIY0_tRec7LOT2PyTIPB2ws19HvSpl0MIyWtKlUChVHgTQVx6PYVvRYnsMUW5iziNxYS0QH4iGdTP_25PSgJsbmXP9AEg9VE9_bYZuH9ztJTthEZz3MhOi9pK4M1DCAKxkhZnDEIZRlhNIuXjZwNNDaAd3cYFCbaz4ApEcS5UnqJA0pso-QYdyythbkBo6vxtFtm9wn1NO6fhaf8zj8GVvxQUFvUcABjP=w1280",
  "5x33cm-09": "https://lh3.googleusercontent.com/sitesv/APaQ0SQMMBP3coNqfAnaI9HIrFtuGarCFTW06XGSdIh-Sw23p18WjSgiM8-fhD8LGvm12TQT3QXYAgYpUhQm9bXoZq4T2QNaaTChRMYY9BRZbtM1zpKejJ6yFMKzEnSZ420wXGh5GpIvuj9zcqZZqMYweibgbbGbMG2mGV2YZnvkwtR-pZVEyOuLIz3qPKrYk_SVa_JHMvBRe83EoPPHk0Y3K5E_VhXczZ1MRGfbVC4=w1280",
  "5x33cm-10": "https://lh3.googleusercontent.com/sitesv/APaQ0SQh4WjgvXVw5bEE-eYDRiJ8ssbrh12ji1fOhicKiqfJtAAdqfjIj7mMjswx99aICaqtQmwl2zGPDt-45Ntid2327Aemtz2SzC25JTCJgDmuV5wXFjjUnSLaI7R8R0r4xfPXYxug3J4Kc_qGh1YyzUHh5tO92ICU1Ae6-T26yWIlvNLd262gdRmOKTtWuhrM_W_0FG8IRVfg1BKAirg-nA3Cv2lOEA9Gw0s8Xaw=w1280",
  "5cm-11": "https://lh3.googleusercontent.com/sitesv/APaQ0STwErAEVSTWntV70rK9c7deY3O_3t_u7bJ9fLiupc4BYnNs_Ybzh5O3bmcIeYyxuoX-442R3HUNXiyFH56WCuIlzlfejqtlUid4nfzZ0_5jfmzkGhNLdgNgqOr9LMXcAcKg9EgF2Uzeh4PLSEWo9kPKdE02lduO8lB1qRIv8mzNpswceUU_HQFGMn6n2_4Nygb1ziyUgaT7B_y-lfEzQNRDqOgoDrxqzoza=w1280",
  "5cm-12": "https://lh3.googleusercontent.com/sitesv/APaQ0SRPQcNvf4p2aTQAlotUGXazFJNxWRLsFIUqd2F0tDvTW_tZYA-O0mfsh31WZyi-cWVI5KNUCQH6aNmtsFHE_2yc3zUJGuak1gXgIVCbY1DUtXtk8DE2zXuuYuAkbOhdrH8lcnJHfyx6-itp6oZsvtNfCmD3fztnVwWqrEWha6aREchDrt1zDAkKubTPGwsdOFsxxUORsfpE3xUfpfMlT37J2lxU66EN13jTCeA=w1280",
  "5cm-13": "https://lh3.googleusercontent.com/sitesv/APaQ0STFa0L8C_tdiNUeECTGl5eQtMQk2XBQbfOeBN-AOSuoyuXw_5oTX5QLxJ7Jy4EOca4xJeHIMdci-LMliykpP5Rf9Ny1wxXNUYrNbqqGQg9H8B7FSoezdsNT36N2ass8nejDnLka9q2EVWURUMvEM-ob4E-A1rNYUB0_nn3xElXPnyfdd9vCrYwZm22csJ9_TVS7Xd0erWd8gcGY2gRL6nPxGODm9IYxSiB6RE8=w1280",
  "5x33cm-14": "https://lh3.googleusercontent.com/sitesv/APaQ0SQp5EiZ9pbaHGPcLiFE4XMzA1HbKvqrT9QN6eKCpCgdWTZWHgREPWIWJuk_1Nh6z2n1KLXYefttH1DELoFFQzukAHPTniWTBm0I1d8QnaQIj4ZxC-UVJAgmHazQP1n5LRASFgC2WVFJd7DKYb8IlMFJDXOhuMc7nw2_n1lus1hMwZ0-cQoCVoF4kG0sJPlPi36sY8KfmXdi-_5FSEsMXwI2zbY1W-7d_JA3T7k=w1280",
  "5cm-15": "https://lh3.googleusercontent.com/sitesv/APaQ0SQk8o4X7WpzL9XTXZDZBpoYWjuArWgS8kKtZnil6-xbpaOx4X57M-4jmvlPZ_UzGWsJO_arMbhrj9j1aJNGxAubH74LSI0Svi-VVs7Nf2-JT3LIeohzLcGRQJftt65yiNzYgex7AIhtVmx_wvGcEOPSFIwH6Y4Pxyc5RFAcjy_B3OqcdZRZ5qPnzozpnDETQJgWgP4u637xk9Q01a3mFRB1E_fAsBcpgt9MFBM=w1280"
}

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

req_headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
}

for name, url in images.items():
    try:
        req = urllib.request.Request(url, headers=req_headers)
        with urllib.request.urlopen(req, context=ctx) as response:
            with open(f"{target_dir}/{name}.jpg", 'wb') as f:
                f.write(response.read())
        print(f"Downloaded {name}")
    except Exception as e:
        print(f"Failed {name}: {e}")
