import { JSDOM } from 'jsdom';
const dom = new JSDOM();
globalThis.window = dom.window;
global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;

import * as L from 'leaflet';
console.log('ESM import Leaflet success:', typeof L.map);
