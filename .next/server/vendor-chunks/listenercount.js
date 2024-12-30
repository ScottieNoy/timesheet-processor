"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "vendor-chunks/listenercount";
exports.ids = ["vendor-chunks/listenercount"];
exports.modules = {

/***/ "(rsc)/./node_modules/listenercount/index.js":
/*!*********************************************!*\
  !*** ./node_modules/listenercount/index.js ***!
  \*********************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

eval("\nvar listenerCount = (__webpack_require__(/*! events */ \"events\").listenerCount);\n// listenerCount isn't in node 0.10, so here's a basic polyfill\nlistenerCount = listenerCount || function(ee, event) {\n    var listeners = ee && ee._events && ee._events[event];\n    if (Array.isArray(listeners)) {\n        return listeners.length;\n    } else if (typeof listeners === \"function\") {\n        return 1;\n    } else {\n        return 0;\n    }\n};\nmodule.exports = listenerCount;\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvbGlzdGVuZXJjb3VudC9pbmRleC5qcyIsIm1hcHBpbmdzIjoiQUFBQTtBQUVBLElBQUlBLGdCQUFnQkMsMkRBQStCO0FBQ25ELCtEQUErRDtBQUMvREQsZ0JBQWdCQSxpQkFBaUIsU0FBVUUsRUFBRSxFQUFFQyxLQUFLO0lBQ2xELElBQUlDLFlBQVlGLE1BQU1BLEdBQUdHLE9BQU8sSUFBSUgsR0FBR0csT0FBTyxDQUFDRixNQUFNO0lBQ3JELElBQUlHLE1BQU1DLE9BQU8sQ0FBQ0gsWUFBWTtRQUM1QixPQUFPQSxVQUFVSSxNQUFNO0lBQ3pCLE9BQU8sSUFBSSxPQUFPSixjQUFjLFlBQVk7UUFDMUMsT0FBTztJQUNULE9BQU87UUFDTCxPQUFPO0lBQ1Q7QUFDRjtBQUVBSyxPQUFPQyxPQUFPLEdBQUdWIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vdGltZXNoZWV0LXByb2Nlc3Nvci8uL25vZGVfbW9kdWxlcy9saXN0ZW5lcmNvdW50L2luZGV4LmpzP2NhZTciXSwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnXG5cbnZhciBsaXN0ZW5lckNvdW50ID0gcmVxdWlyZSgnZXZlbnRzJykubGlzdGVuZXJDb3VudFxuLy8gbGlzdGVuZXJDb3VudCBpc24ndCBpbiBub2RlIDAuMTAsIHNvIGhlcmUncyBhIGJhc2ljIHBvbHlmaWxsXG5saXN0ZW5lckNvdW50ID0gbGlzdGVuZXJDb3VudCB8fCBmdW5jdGlvbiAoZWUsIGV2ZW50KSB7XG4gIHZhciBsaXN0ZW5lcnMgPSBlZSAmJiBlZS5fZXZlbnRzICYmIGVlLl9ldmVudHNbZXZlbnRdXG4gIGlmIChBcnJheS5pc0FycmF5KGxpc3RlbmVycykpIHtcbiAgICByZXR1cm4gbGlzdGVuZXJzLmxlbmd0aFxuICB9IGVsc2UgaWYgKHR5cGVvZiBsaXN0ZW5lcnMgPT09ICdmdW5jdGlvbicpIHtcbiAgICByZXR1cm4gMVxuICB9IGVsc2Uge1xuICAgIHJldHVybiAwXG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBsaXN0ZW5lckNvdW50XG4iXSwibmFtZXMiOlsibGlzdGVuZXJDb3VudCIsInJlcXVpcmUiLCJlZSIsImV2ZW50IiwibGlzdGVuZXJzIiwiX2V2ZW50cyIsIkFycmF5IiwiaXNBcnJheSIsImxlbmd0aCIsIm1vZHVsZSIsImV4cG9ydHMiXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/listenercount/index.js\n");

/***/ })

};
;