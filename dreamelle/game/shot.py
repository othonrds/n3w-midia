import sys
from playwright.sync_api import sync_playwright
url=sys.argv[1]
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={'width':844,'height':390},device_scale_factor=2)
    errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.route('**/connect.facebook.net/**',lambda r:r.abort())
    pg.goto(url); pg.wait_for_timeout(2500); pg.screenshot(path='s1_splash.png')
    pg.evaluate("Dreamelle.state.name='Ava';Dreamelle.go('char')"); pg.wait_for_timeout(2000); pg.screenshot(path='s2_char.png')
    pg.evaluate("Dreamelle.go('career')"); pg.wait_for_timeout(2500); pg.screenshot(path='s3_career.png')
    pg.evaluate("Object.assign(Dreamelle.state,{created:true,career:'lawyer',onbDone:true});Dreamelle.go('home')"); pg.wait_for_timeout(2500); pg.screenshot(path='s4_home.png')
    pg.evaluate("Dreamelle.go('map')"); pg.wait_for_timeout(2500); pg.screenshot(path='s5_map.png')
    pg.evaluate("Dreamelle.go('law')"); pg.wait_for_timeout(2500); pg.screenshot(path='s6_law.png')
    pg.evaluate("Dreamelle.showPaywall()"); pg.wait_for_timeout(2500); pg.screenshot(path='s7_pay.png')
    print('errors',errs); b.close()
