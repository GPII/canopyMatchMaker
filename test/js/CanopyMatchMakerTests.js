/*!
GPII Canopy MatchMaker Tests

Copyright 2012 OCAD University
Copyright 2012 Raising The Floor - International

Licensed under the New BSD license. You may not use this file except in
compliance with this License.

You may obtain a copy of the License at
https://github.com/gpii/universal/LICENSE.txt
*/

// Declare dependencies
/*global require, fluid, jqUnit, gpii, start*/

var fluid = fluid || require("universal");
var gpii = fluid.registerNamespace("gpii");

(function () {
    "use strict";

    fluid.registerNamespace("gpii.tests.canopyMatchMaker");

    var magnifier = {"settingsHandlers": [{
        "type": "gpii.integrationTesting.mockSettingsHandler",
        "capabilities": ["display.screenEnhancement"],
        "capabilitiesTransformations": {
            "mag-factor": "display.screenEnhancement.magnification",
            "show-cross-hairs": "display.screenEnhancement.-provisional-showCrosshairs",
            "mouse-tracking": {
                "expander": {
                    "type": "fluid.model.transform.valueMapper",
                    "inputPath": "display.screenEnhancement.tracking",
                    "options": {
                        "mouse": {
                            "outputValue": "centered"
                        }
                    }
                }
            }
        }
    }]
    };

    var lesserMagnifier = {"settingsHandlers": [{
        "type": "gpii.integrationTesting.mockSettingsHandler",
        "capabilitiesTransformations": {
            "mag-factor": "display.screenEnhancement.magnification"
        }
    }, {
        "type": "gpii.integrationTesting.mockSettingsHandler",
        "capabilities": "display.screenEnhancement.magnification"
    }]
    };

    var magnifierLeaves = [
        "display.screenEnhancement.magnification",
        "display.screenEnhancement.-provisional-showCrosshairs",
        "display.screenEnhancement.tracking",
        "display.screenEnhancement"
    ];

    var magnifierSkeleton = {
        display: {
            screenEnhancement: {
                magnification: {},
                "-provisional-showCrosshairs": {},
                tracking: {}
            }
        }
    };

    var escapedLeaves = [
        "display.screenReader.applications.nvda\\.screenReader"
    ];

    var escapedSkeleton = {
        display: {
            screenReader: {
                applications: {
                    "nvda.screenReader": {}
                }
            }
        }
    };

    var sammyProfile = {
        "display": {
            "screenEnhancement": {
                "fontSize": 24,
                "foregroundColor": "white",
                "backgroundColor": "black",
                "fontFace": {
                    "fontName": ["Comic Sans"],
                    "genericFontFace": "sans serif"
                },
                "magnification": 2.0,
                "tracking": "mouse",
                "invertImages": true,
                "-provisional-showCrosshairs": true
            }
        }
    };

    var sammyLeaves = [
        "display.screenEnhancement.-provisional-showCrosshairs",
        "display.screenEnhancement.backgroundColor",
        "display.screenEnhancement.fontFace.fontName.0",
        "display.screenEnhancement.fontFace.genericFontFace",
        "display.screenEnhancement.fontSize",
        "display.screenEnhancement.foregroundColor",
        "display.screenEnhancement.invertImages",
        "display.screenEnhancement.magnification",
        "display.screenEnhancement.tracking"
    ];

    var expandFitness = function (fitnesses) {
        return fluid.transform(fitnesses, function(fit, index) {
            return {
                fitness: fit,
                index: index
            };
        })
    };

    var extractIndices = function (solns) {
        return fluid.transform(solns, function (soln) {
            return soln.index;
        });
    };

    var extractDispositions = function (solns) {
        var togo = [];
        fluid.each(solns, function(soln) {
            togo[soln.index] = soln.disposition;
        });
        return togo;
    };

    var canopy = gpii.matchMaker.canopy;

    jqUnit.module("Utilities");

    jqUnit.test("Compute Leaves", function () {
        var leaves = gpii.matchMaker.computeLeaves(sammyProfile);
        jqUnit.assertDeepEq("Computed Leaves", sammyLeaves, leaves.sort());
    });

    jqUnit.test("Path Utilities", function() {
        jqUnit.assertEquals("Exact depth", 0, gpii.matchMaker.prefixLength("display.screenEnhancement.fontSize", sammyProfile));
        jqUnit.assertEquals("Near depth", 0, gpii.matchMaker.prefixLength("display.screenEnhancement.fontSize", sammyProfile));
        jqUnit.assertEquals("Mid depth", -1, gpii.matchMaker.prefixLength("display.unrecognizable", sammyProfile));
        jqUnit.assertEquals("Far depth", -2, gpii.matchMaker.prefixLength("display.unrecognizable.thing", sammyProfile));
        var skeleton = gpii.matchMaker.pathsToSkeleton(magnifierLeaves);
        jqUnit.assertDeepEq("Computed model skeleton", magnifierSkeleton, skeleton);

        var skeleton2 = gpii.matchMaker.pathsToSkeleton(escapedLeaves);
        jqUnit.assertDeepEq("Computed model escaped skeleton", escapedSkeleton, skeleton2);

    });


    jqUnit.test("Fitness computation", function() {
        var fitness = canopy.computeFitness(sammyLeaves, magnifierSkeleton);
        var expected = [0, 0, 0, -1, -1, -1, -1, -2, -3];
        jqUnit.assertDeepEq("Computed fitness vector", expected, fitness);

        var fitnesses = [
            [-1, -3, 0],
            [0, 0, 0],
            [0, 0],
            [0, 0, 0, 0],
            [-1, -3, -1]
        ];
        var solns = canopy.sortSolutions(expandFitness(fitnesses));
        var indices = extractIndices(solns);
        var expected = [3, 1, 2, 0, 4];
        jqUnit.assertDeepEq("Ranked fitnesses", expected, indices);
    });

    jqUnit.module("MatchMaker");
    jqUnit.test("Rank and dispose solutions", function() {
        var solutions = [lesserMagnifier, magnifier];
        var expanded = matchMaker.expandSolutions(solutions);
        var ranked = canopy.rankSolutions(sammyLeaves, expanded);
        var indices = extractIndices(ranked);
        var expected = [1, 0];
        jqUnit.assertDeepEq("Ranked solutions", expected, indices);

        matchMaker.disposeSolutions(sammyProfile, solutions, canopy.disposeStrategy).then(function (disposed) {
            var itions = matchMaker.extractDispositions(disposed);
            var expected = ["reject", "accept"];
            jqUnit.assertDeepEq("Disposed solutions", expected, itions);
        });
    });

}());