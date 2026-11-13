// tests/e2e/framework.js
/**
 * HyperNova E2E Standalone Test Framework & Mock Headless Runtime
 * Zero external dependencies — pure Node.js runtime.
 */

const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');

class AssertionError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AssertionError';
  }
}

class TestHarness {
  constructor() {
    this.currentSuite = 'Default Suite';
    this.tests = [];
    this.beforeEachHooks = [];
    this.afterEachHooks = [];
    this.passed = 0;
    this.failed = 0;
    this.skipped = 0;
    this.errors = [];
    this.startTime = 0;
  }

  describe(name, fn) {
    const prevSuite = this.currentSuite;
    this.currentSuite = name;
    fn();
    this.currentSuite = prevSuite;
  }

  test(name, fn) {
    this.tests.push({
      suite: this.currentSuite,
      name,
      fn,
    });
  }

  beforeEach(fn) {
    this.beforeEachHooks.push(fn);
  }

  afterEach(fn) {
    this.afterEachHooks.push(fn);
  }

  // Assertion Library
  assert(condition, message = 'Expected condition to be truthy') {
    if (!condition) {
      throw new AssertionError(message);
    }
  }

  assertEqual(actual, expected, message = '') {
    if (actual !== expected) {
      const prefix = message ? `${message} — ` : '';
      throw new AssertionError(`${prefix}Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    }
  }

  assertDeepEqual(actual, expected, message = '') {
    const aJson = JSON.stringify(actual);
    const eJson = JSON.stringify(expected);
    if (aJson !== eJson) {
      const prefix = message ? `${message} — ` : '';
      throw new AssertionError(`${prefix}Deep equality mismatch:\nExpected: ${eJson}\nActual:   ${aJson}`);
    }
  }

  assertRange(val, min, max, message = '') {
    if (typeof val !== 'number' || isNaN(val)) {
      throw new AssertionError(`${message ? message + ' — ' : ''}Value ${val} is not a valid number`);
    }
    if (val < min || val > max) {
      const prefix = message ? `${message} — ` : '';
      throw new AssertionError(`${prefix}Value ${val} outside expected range [${min}, ${max}]`);
    }
  }

  assertMatch(str, regex, message = '') {
    if (typeof str !== 'string' || !regex.test(str)) {
      const prefix = message ? `${message} — ` : '';
      throw new AssertionError(`${prefix}String "${str}" does not match pattern ${regex}`);
    }
  }

  async run(filterTier = null) {
    this.startTime = Date.now();
    this.passed = 0;
    this.failed = 0;
    this.errors = [];

    console.log(`\n===============================================================`);
    console.log(`         HYPERNOVA E2E TEST SUITE — EXECUTION RUNNER           `);
    console.log(`===============================================================`);
    if (filterTier) {
      console.log(`Filtering for tier: ${filterTier}`);
    }

    let activeSuite = '';
    const tierSummaries = {};

    for (const t of this.tests) {
      if (filterTier && !t.suite.toLowerCase().includes(filterTier.toLowerCase())) {
        continue;
      }

      // Track by tier
      const tierKey = t.suite.split(':')[0].trim();
      if (!tierSummaries[tierKey]) {
        tierSummaries[tierKey] = { total: 0, passed: 0, failed: 0 };
      }
      tierSummaries[tierKey].total++;

      if (t.suite !== activeSuite) {
        activeSuite = t.suite;
        console.log(`\n>>> [${activeSuite}]`);
      }

      const t0 = Date.now();
      try {
        for (const hook of this.beforeEachHooks) {
          await hook();
        }
        await t.fn(this);
        for (const hook of this.afterEachHooks) {
          await hook();
        }
        this.passed++;
        tierSummaries[tierKey].passed++;
        const ms = Date.now() - t0;
        console.log(`  ✓ [PASS] ${t.name} (${ms}ms)`);
      } catch (err) {
        this.failed++;
        tierSummaries[tierKey].failed++;
        const ms = Date.now() - t0;
        console.error(`  ✗ [FAIL] ${t.name} (${ms}ms)`);
        console.error(`     Error: ${err.message}`);
        this.errors.push({ suite: t.suite, name: t.name, error: err });
      }
    }

    const duration = ((Date.now() - this.startTime) / 1000).toFixed(2);
    const total = this.passed + this.failed;
    const rate = total > 0 ? ((this.passed / total) * 100).toFixed(1) : 0;

    console.log(`\n===============================================================`);
    console.log(`                 TIER BREAKDOWN & SUMMARY                      `);
    console.log(`===============================================================`);
    for (const [tier, stats] of Object.entries(tierSummaries)) {
      const tierRate = stats.total > 0 ? ((stats.passed / stats.total) * 100).toFixed(1) : 0;
      console.log(`  * ${tier.padEnd(30)}: ${stats.passed}/${stats.total} passed (${tierRate}%)`);
    }

    console.log(`---------------------------------------------------------------`);
    console.log(`TOTAL TESTS: ${total} | PASSED: ${this.passed} | FAILED: ${this.failed}`);
    console.log(`PASS RATE: ${rate}% | TOTAL DURATION: ${duration}s`);
    console.log(`===============================================================\n`);

    if (this.failed > 0) {
      console.error(`FAILED TESTS SUMMARY (${this.failed}):`);
      this.errors.forEach((e, idx) => {
        console.error(` ${idx + 1}. [${e.suite}] ${e.name}`);
        console.error(`    ${e.error.message}`);
      });
      console.error('');
    }

    return this.failed === 0;
  }
}

/**
 * Headless DOM Mock Engine
 */
class MockDOMElement {
  constructor(tagName = 'div', id = '') {
    this.tagName = tagName.toUpperCase();
    this.id = id;
    this.hidden = false;
    this.textContent = '';
    this.innerHTML = '';
    this.value = '';
    this.checked = false;
    this.type = 'text';
    this.children = [];
    this.parentElement = null;
    this.attributes = new Map();
    this.eventListeners = new Map();
    this.dataset = {};
    this._customStyles = {};
    this._classes = new Set();
    this._rect = { width: 100, height: 34, top: 0, left: 0, bottom: 34, right: 100 };

    const self = this;
    this.classList = {
      add(...tokens) {
        tokens.forEach((t) => t && self._classes.add(t));
      },
      remove(...tokens) {
        tokens.forEach((t) => self._classes.delete(t));
      },
      toggle(token, force) {
        if (force === true) {
          self._classes.add(token);
          return true;
        } else if (force === false) {
          self._classes.delete(token);
          return false;
        }
        if (self._classes.has(token)) {
          self._classes.delete(token);
          return false;
        } else {
          self._classes.add(token);
          return true;
        }
      },
      contains(token) {
        return self._classes.has(token);
      },
      entries() {
        return self._classes.entries();
      },
      values() {
        return self._classes.values();
      },
      get length() {
        return self._classes.size;
      },
      toString() {
        return Array.from(self._classes).join(' ');
      },
    };

    this.style = new Proxy(this._customStyles, {
      get(target, prop) {
        if (prop === 'getPropertyValue') {
          return (key) => target[key] || '';
        }
        if (prop === 'setProperty') {
          return (key, val) => {
            target[key] = String(val);
          };
        }
        return target[prop] || '';
      },
      set(target, prop, val) {
        target[prop] = String(val);
        return true;
      },
    });
  }

  get className() {
    return Array.from(this._classes).join(' ');
  }

  set className(val) {
    this._classes.clear();
    if (val && typeof val === 'string') {
      val.split(/\s+/).filter(Boolean).forEach((c) => this._classes.add(c));
    }
  }

  setAttribute(name, val) {
    this.attributes.set(name, String(val));
    if (name.startsWith('data-')) {
      const key = name.slice(5).replace(/-([a-z])/g, (_, l) => l.toUpperCase());
      this.dataset[key] = String(val);
    }
    if (name === 'id') this.id = val;
    if (name === 'class') this.className = val;
    if (name === 'type') this.type = val;
    if (name === 'value') this.value = val;
  }

  getAttribute(name) {
    return this.attributes.get(name) || null;
  }

  hasAttribute(name) {
    return this.attributes.has(name);
  }

  removeAttribute(name) {
    this.attributes.delete(name);
    if (name.startsWith('data-')) {
      const key = name.slice(5).replace(/-([a-z])/g, (_, l) => l.toUpperCase());
      delete this.dataset[key];
    }
  }

  appendChild(child) {
    if (child) {
      child.parentElement = this;
      this.children.push(child);
    }
    return child;
  }

  removeChild(child) {
    const idx = this.children.indexOf(child);
    if (idx !== -1) {
      child.parentElement = null;
      this.children.splice(idx, 1);
    }
    return child;
  }

  addEventListener(type, handler) {
    if (!this.eventListeners.has(type)) {
      this.eventListeners.set(type, []);
    }
    this.eventListeners.get(type).push(handler);
  }

  removeEventListener(type, handler) {
    if (this.eventListeners.has(type)) {
      const list = this.eventListeners.get(type);
      const idx = list.indexOf(handler);
      if (idx !== -1) list.splice(idx, 1);
    }
  }

  dispatchEvent(event) {
    const eventType = typeof event === 'string' ? event : event.type;
    const handlers = this.eventListeners.get(eventType) || [];
    for (const h of handlers) {
      h.call(this, event);
    }
    return true;
  }

  click() {
    this.dispatchEvent({ type: 'click', target: this });
  }

  setBoundingClientRect(rect) {
    this._rect = Object.assign({}, this._rect, rect);
  }

  getBoundingClientRect() {
    return Object.assign({}, this._rect);
  }

  querySelector(selector) {
    return querySelectorFromElement(this, selector);
  }

  querySelectorAll(selector) {
    return querySelectorAllFromElement(this, selector);
  }
}

function matchesSelector(el, sel) {
  if (!sel || !el) return false;
  sel = sel.trim();

  // ID match: #foo
  if (sel.startsWith('#')) {
    return el.id === sel.slice(1);
  }
  // Class match: .bar
  if (sel.startsWith('.')) {
    const cls = sel.slice(1);
    return el.classList.contains(cls);
  }
  // Tag match: div, button
  if (/^[a-zA-Z0-9_-]+$/.test(sel)) {
    return el.tagName.toLowerCase() === sel.toLowerCase();
  }
  // Attribute selector: [data-feat="slideStats"] or [data-feature]
  const attrMatch = sel.match(/^\[([a-zA-Z0-9_-]+)(?:([*^$]?=)(["']?)(.*?)\3)?\]$/);
  if (attrMatch) {
    const attrName = attrMatch[1];
    const op = attrMatch[2];
    const attrVal = attrMatch[4];
    if (!el.hasAttribute(attrName)) return false;
    if (!op) return true;
    const val = el.getAttribute(attrName);
    if (op === '=') return val === attrVal;
    if (op === '^=') return val.startsWith(attrVal);
    if (op === '$=') return val.endsWith(attrVal);
    if (op === '*=') return val.includes(attrVal);
  }
  return false;
}

function querySelectorFromElement(root, selector) {
  const parts = selector.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    const q = parts[0];
    if (matchesSelector(root, q)) return root;
    for (const c of root.children) {
      const res = querySelectorFromElement(c, q);
      if (res) return res;
    }
    return null;
  }
  // Descendant query
  const first = parts[0];
  const rest = parts.slice(1).join(' ');
  const matchingRoots = [];
  collectMatching(root, first, matchingRoots);
  for (const m of matchingRoots) {
    const res = querySelectorFromElement(m, rest);
    if (res) return res;
  }
  return null;
}

function collectMatching(node, selector, acc) {
  if (matchesSelector(node, selector)) {
    acc.push(node);
  }
  for (const c of node.children) {
    collectMatching(c, selector, acc);
  }
}

function querySelectorAllFromElement(root, selector) {
  const acc = [];
  collectMatching(root, selector, acc);
  return acc;
}

/**
 * Creates full mock headless browser environment for tests.
 */
function createMockEnvironment() {
  const root = new MockDOMElement('html', 'root');
  const body = new MockDOMElement('body', 'body');
  root.appendChild(body);

  const elementsById = new Map();
  elementsById.set('root', root);
  elementsById.set('body', body);

  const doc = {
    documentElement: root,
    body: body,
    createElement(tag) {
      return new MockDOMElement(tag);
    },
    getElementById(id) {
      if (elementsById.has(id)) return elementsById.get(id);
      const res = querySelectorFromElement(root, `#${id}`);
      if (res) elementsById.set(id, res);
      return res || null;
    },
    querySelector(sel) {
      return querySelectorFromElement(root, sel);
    },
    querySelectorAll(sel) {
      return querySelectorAllFromElement(root, sel);
    },
    addEventListener() {},
    removeEventListener() {},
  };

  // Mock AudioContext
  class MockAudioParam {
    constructor(defVal = 0) {
      this.value = defVal;
      this.events = [];
    }
    setValueAtTime(val, t) {
      this.value = val;
      this.events.push({ type: 'setValueAtTime', val, t });
    }
    linearRampToValueAtTime(val, t) {
      this.value = val;
      this.events.push({ type: 'linearRampToValueAtTime', val, t });
    }
    exponentialRampToValueAtTime(val, t) {
      this.value = val;
      this.events.push({ type: 'exponentialRampToValueAtTime', val, t });
    }
  }

  class MockGainNode {
    constructor() {
      this.gain = new MockAudioParam(1);
    }
    connect(dest) {
      this.destination = dest;
    }
  }

  class MockOscillatorNode {
    constructor() {
      this.frequency = new MockAudioParam(440);
      this.type = 'sine';
      this.started = false;
      this.stopped = false;
      this.stopTime = null;
    }
    start() {
      this.started = true;
    }
    stop(t) {
      this.stopped = true;
      this.stopTime = t;
    }
    connect(dest) {
      this.destination = dest;
    }
  }

  class MockBiquadFilterNode {
    constructor() {
      this.type = 'lowpass';
      this.frequency = new MockAudioParam(1400);
      this.Q = new MockAudioParam(1);
    }
    connect(dest) {
      this.destination = dest;
    }
  }

  const audioHistory = {
    oscillators: [],
    gains: [],
    filters: [],
  };

  class MockAudioContext {
    constructor() {
      this.currentTime = 0;
      this.state = 'running';
      this.destination = {};
    }
    resume() {
      this.state = 'running';
      return Promise.resolve();
    }
    suspend() {
      this.state = 'suspended';
      return Promise.resolve();
    }
    createGain() {
      const g = new MockGainNode();
      audioHistory.gains.push(g);
      return g;
    }
    createOscillator() {
      const o = new MockOscillatorNode();
      audioHistory.oscillators.push(o);
      return o;
    }
    createBiquadFilter() {
      const f = new MockBiquadFilterNode();
      audioHistory.filters.push(f);
      return f;
    }
  }

  // Mock HTMLAudioElement
  class MockAudioElement extends EventEmitter {
    constructor(src = '') {
      super();
      this.src = src;
      this.currentTime = 0;
      this.duration = 6.5;
      this.volume = 1;
      this.paused = true;
      this.ended = false;
    }
    play() {
      this.paused = false;
      this.emit('play');
      return Promise.resolve();
    }
    pause() {
      this.paused = true;
      this.emit('pause');
    }
  }

  const localStorageData = new Map();
  const localStorageMock = {
    getItem: (k) => (localStorageData.has(k) ? localStorageData.get(k) : null),
    setItem: (k, v) => localStorageData.set(k, String(v)),
    removeItem: (k) => localStorageData.delete(k),
    clear: () => localStorageData.clear(),
  };

  const win = {
    document: doc,
    AudioContext: MockAudioContext,
    webkitAudioContext: MockAudioContext,
    Audio: MockAudioElement,
    localStorage: localStorageMock,
    requestAnimationFrame: (cb) => setTimeout(cb, 16),
    cancelAnimationFrame: (id) => clearTimeout(id),
  };

  return {
    window: win,
    document: doc,
    root,
    body,
    audioHistory,
    MockDOMElement,
    MockAudioElement,
  };
}

module.exports = {
  TestHarness,
  AssertionError,
  MockDOMElement,
  createMockEnvironment,
};
