/*  Sort Layers by Screen Position v3.1 (Stable) — ScriptUI Panel
    - Sort selected layers by comp-space position (toComp)
    - Full combo controls: Primary axis + direction, Secondary axis + direction
    - Sample time (current / inPoint / outPoint / comp start)
    - Point reference: bounds center (Text/Shape) or anchorPoint fallback
    - v3.1 adds:
        * Tie tolerance (px)
        * Preserve stacking for ties (stable)
        * NEW: Preserve stacking within PRIMARY buckets (ignore secondary for ties)
              -> Ideal for stacked bars: sort left→right but keep vertical stacking order.
    - IMPORTANT: Uses a stable merge sort (Array.sort is not reliably stable in ExtendScript).
*/

(function sortLayersPanelV31Stable(thisObj) {

    // ---------- Stable merge sort ----------
    function stableMergeSort(arr, cmp) {
        if (arr.length <= 1) return arr;

        var mid = Math.floor(arr.length / 2);
        var left = stableMergeSort(arr.slice(0, mid), cmp);
        var right = stableMergeSort(arr.slice(mid), cmp);

        return merge(left, right, cmp);
    }

    function merge(left, right, cmp) {
        var result = [];
        var i = 0, j = 0;

        while (i < left.length && j < right.length) {
            var c = cmp(left[i], right[j]);

            // Stability: when equal, take from LEFT first
            if (c <= 0) {
                result.push(left[i++]);
            } else {
                result.push(right[j++]);
            }
        }

        while (i < left.length) result.push(left[i++]);
        while (j < right.length) result.push(right[j++]);

        return result;
    }

    function buildUI(thisObj) {
        var pal = (thisObj instanceof Panel)
            ? thisObj
            : new Window("palette", "Sort Layers by Screen Position v3.1 (Stable)", undefined, { resizeable: true });

        if (!pal) return pal;

        pal.orientation = "column";
        pal.alignChildren = ["fill", "top"];
        pal.spacing = 8;
        pal.margins = 10;

        // ---------- SORT CONTROLS ----------
        var sortPanel = pal.add("panel", undefined, "Sort Controls");
        sortPanel.orientation = "column";
        sortPanel.alignChildren = ["fill", "top"];
        sortPanel.margins = 10;
        sortPanel.spacing = 8;

        // Primary row
        var row1 = sortPanel.add("group");
        row1.orientation = "row";
        row1.alignChildren = ["left", "center"];
        row1.spacing = 10;

        row1.add("statictext", undefined, "Primary:");

        var priAxisGrp = row1.add("group");
        priAxisGrp.orientation = "row";
        priAxisGrp.alignChildren = ["left", "center"];
        priAxisGrp.spacing = 6;

        var rbPriX = priAxisGrp.add("radiobutton", undefined, "X");
        var rbPriY = priAxisGrp.add("radiobutton", undefined, "Y");
        rbPriY.value = true;

        var priDirGrp = row1.add("group");
        priDirGrp.orientation = "row";
        priDirGrp.alignChildren = ["left", "center"];
        priDirGrp.spacing = 6;

        var rbPriAsc = priDirGrp.add("radiobutton", undefined, "Asc");
        var rbPriDesc = priDirGrp.add("radiobutton", undefined, "Desc");
        rbPriAsc.value = true;

        // Secondary row
        var row2 = sortPanel.add("group");
        row2.orientation = "row";
        row2.alignChildren = ["left", "center"];
        row2.spacing = 10;

        row2.add("statictext", undefined, "Secondary:");

        var secAxisGrp = row2.add("group");
        secAxisGrp.orientation = "row";
        secAxisGrp.alignChildren = ["left", "center"];
        secAxisGrp.spacing = 6;

        var rbSecAuto = secAxisGrp.add("radiobutton", undefined, "Auto other axis");
        var rbSecX = secAxisGrp.add("radiobutton", undefined, "X");
        var rbSecY = secAxisGrp.add("radiobutton", undefined, "Y");
        rbSecAuto.value = true;

        var secDirGrp = row2.add("group");
        secDirGrp.orientation = "row";
        secDirGrp.alignChildren = ["left", "center"];
        secDirGrp.spacing = 6;

        var rbSecAsc = secDirGrp.add("radiobutton", undefined, "Asc");
        var rbSecDesc = secDirGrp.add("radiobutton", undefined, "Desc");
        rbSecAsc.value = true;

        // Utility row
        var row3 = sortPanel.add("group");
        row3.orientation = "row";
        row3.alignChildren = ["fill", "center"];
        row3.spacing = 8;

        var btnSwap = row3.add("button", undefined, "Swap X/Y");
        var btnFlipPrimary = row3.add("button", undefined, "Flip Primary Dir");
        var btnFlipSecondary = row3.add("button", undefined, "Flip Secondary Dir");

        // Tolerance / stability row
        var row4 = sortPanel.add("group");
        row4.orientation = "column";
        row4.alignChildren = ["left", "center"];
        row4.spacing = 6;

        var row4a = row4.add("group");
        row4a.orientation = "row";
        row4a.alignChildren = ["left", "center"];
        row4a.spacing = 10;

        row4a.add("statictext", undefined, "Tie tolerance (px):");
        var etTol = row4a.add("edittext", undefined, "2.0");
        etTol.characters = 6;

        var row4b = row4.add("group");
        row4b.orientation = "column";
        row4b.alignChildren = ["left", "center"];
        row4b.spacing = 4;

        var cbStable = row4b.add("checkbox", undefined, "Preserve stacking for ties (Primary+Secondary within tolerance)");
        cbStable.value = true;

        // NEW v3.1 option
        var cbPrimaryBucket = row4b.add("checkbox", undefined, "Preserve stacking within PRIMARY buckets (ignore Secondary for ties)");
        cbPrimaryBucket.value = true; // default ON because it's the common “stacked bars” need

        // ---------- SAMPLING CONTROLS ----------
        var samplePanel = pal.add("panel", undefined, "Sampling");
        samplePanel.orientation = "column";
        samplePanel.alignChildren = ["fill", "top"];
        samplePanel.margins = 10;
        samplePanel.spacing = 8;

        var timeGrp = samplePanel.add("group");
        timeGrp.orientation = "row";
        timeGrp.alignChildren = ["left", "center"];
        timeGrp.spacing = 8;
        timeGrp.add("statictext", undefined, "Sample time:");

        var ddTime = timeGrp.add("dropdownlist", undefined, [
            "Current time",
            "Layer inPoint",
            "Layer outPoint",
            "Comp start (0)"
        ]);
        ddTime.selection = 0;

        var cbBounds = samplePanel.add("checkbox", undefined, "Use bounds center when possible (Text/Shape), else anchorPoint");
        cbBounds.value = true;

        // ---------- ACTIONS ----------
        var actions = pal.add("group");
        actions.orientation = "row";
        actions.alignChildren = ["fill", "center"];
        actions.spacing = 8;

        var btnSort = actions.add("button", undefined, "Sort Selected");
        var btnHelp = actions.add("button", undefined, "Help");

        var st = pal.add("statictext", undefined, "Ready.");
        st.characters = 90;

        pal.onResizing = pal.onResize = function () { this.layout.resize(); };

        // ---------- Helpers ----------
        function getSampleTime(comp, layer, selectionIndex) {
            switch (selectionIndex) {
                case 0: return comp.time;
                case 1: return layer.inPoint;
                case 2: return layer.outPoint;
                case 3: return 0;
                default: return comp.time;
            }
        }

        function getScreenXY(layer, t, preferBoundsCenter) {
            var fxParade = layer.property("ADBE Effect Parade");
            if (!fxParade) return [0, 0];

            var ptFx = fxParade.addProperty("ADBE Point Control");
            ptFx.name = "__tempScreenPos__";
            var ptProp = ptFx.property(1);

            var exprAnchor = "toComp(anchorPoint);";
            var exprBoundsCenter =
                "var p;\n" +
                "try {\n" +
                "  var r = sourceRectAtTime(time, false);\n" +
                "  p = toComp([r.left + r.width/2, r.top + r.height/2]);\n" +
                "} catch (e) {\n" +
                "  p = toComp(anchorPoint);\n" +
                "}\n" +
                "p;";

            ptProp.expression = preferBoundsCenter ? exprBoundsCenter : exprAnchor;

            var v;
            try { v = ptProp.valueAtTime(t, false); } catch (e) { v = [0, 0]; }

            try { ptFx.remove(); } catch (e2) {}
            return v;
        }

        function parseTol() {
            var n = parseFloat(etTol.text);
            if (isNaN(n) || n < 0) return 2.0;
            return n;
        }

        function getAxisAndDir() {
            var priAxis = rbPriX.value ? "x" : "y";
            var priDir = rbPriAsc.value ? 1 : -1;

            var secAxis;
            if (rbSecAuto.value) {
                secAxis = (priAxis === "x") ? "y" : "x";
            } else if (rbSecX.value) {
                secAxis = "x";
            } else {
                secAxis = "y";
            }
            var secDir = rbSecAsc.value ? 1 : -1;

            return { priAxis: priAxis, priDir: priDir, secAxis: secAxis, secDir: secDir };
        }

        function comparatorFromControls(tol, preserveTies, preserveWithinPrimaryBucket) {
            var cfg = getAxisAndDir();

            return function (a, b) {
                var ap = (cfg.priAxis === "x") ? a.x : a.y;
                var bp = (cfg.priAxis === "x") ? b.x : b.y;
                var dp = ap - bp;

                // Primary decides order when beyond tolerance
                if (Math.abs(dp) > tol) return dp * cfg.priDir;

                // NEW behavior: within same Primary bucket => keep original stacking order
                // This is the stacked-bar / same-column use case.
                if (preserveWithinPrimaryBucket) {
                    return a.originalLayerIndex - b.originalLayerIndex;
                }

                // Otherwise, use secondary as tie-breaker
                var as = (cfg.secAxis === "x") ? a.x : a.y;
                var bs = (cfg.secAxis === "x") ? b.x : b.y;
                var ds = as - bs;

                if (Math.abs(ds) > tol) return ds * cfg.secDir;

                // True tie on both axes within tolerance
                if (preserveTies) {
                    return a.originalLayerIndex - b.originalLayerIndex;
                }

                return a.layer.index - b.layer.index;
            };
        }

        function safeMoveAfter(layerToMove, refLayer) {
            try { layerToMove.moveAfter(refLayer); return true; } catch (e) { return false; }
        }

        function doSort() {
            var comp = app.project.activeItem;
            if (!(comp instanceof CompItem)) {
                st.text = "No active comp. Click into a comp first.";
                return;
            }

            var selected = comp.selectedLayers;
            if (!selected || selected.length < 2) {
                st.text = "Select 2+ layers in the comp timeline.";
                return;
            }

            // Filter out locked layers
            var layers = [];
            var lockedCount = 0;
            for (var i = 0; i < selected.length; i++) {
                if (selected[i].locked) lockedCount++;
                else layers.push(selected[i]);
            }

            if (layers.length < 2) {
                st.text = lockedCount > 0 ? "Selection is locked (can't reorder locked layers)." : "Need 2+ unlocked layers.";
                return;
            }

            app.beginUndoGroup("Sort Layers by Screen Position v3.1 (Stable)");

            var preferBounds = cbBounds.value;
            var timeIndex = ddTime.selection ? ddTime.selection.index : 0;
            var tol = parseTol();
            var preserveTies = cbStable.value;
            var preservePrimaryBucket = cbPrimaryBucket.value;

            // Capture positions + original stacking order
            var data = [];
            for (i = 0; i < layers.length; i++) {
                var ly = layers[i];
                var t = getSampleTime(comp, ly, timeIndex);
                var xy = getScreenXY(ly, t, preferBounds);

                data.push({
                    layer: ly,
                    x: xy[0],
                    y: xy[1],
                    originalLayerIndex: ly.index
                });
            }

            // Sort with stable merge sort
            var cmp = comparatorFromControls(tol, preserveTies, preservePrimaryBucket);
            data = stableMergeSort(data, cmp);

            // Anchor: keep the sorted layers in the same "block" of stack
            var minIndex = 999999;
            for (i = 0; i < layers.length; i++) {
                if (layers[i].index < minIndex) minIndex = layers[i].index;
            }
            var anchorBeforeLayer = comp.layer(minIndex);

            var anchor = comp.layers.addNull();
            anchor.name = "__SORT_ANCHOR__";
            anchor.enabled = false;
            anchor.shy = true;
            anchor.locked = true;

            try { anchor.moveBefore(anchorBeforeLayer); } catch (eMove) {}

            var moved = 0;
            if (safeMoveAfter(data[0].layer, anchor)) moved++;
            for (i = 1; i < data.length; i++) {
                if (safeMoveAfter(data[i].layer, data[i - 1].layer)) moved++;
            }

            try { anchor.remove(); } catch (eRem) {}

            app.endUndoGroup();

            st.text =
                (lockedCount > 0)
                    ? ("Sorted " + moved + " layers. Skipped " + lockedCount + " locked layer(s).")
                    : ("Sorted " + moved + " layers.");
        }

        // ---------- UI behaviors ----------
        btnSwap.onClick = function () {
            var priIsX = rbPriX.value;
            rbPriX.value = !priIsX;
            rbPriY.value = priIsX;

            if (!rbSecAuto.value) {
                var secIsX = rbSecX.value;
                rbSecX.value = !secIsX;
                rbSecY.value = secIsX;
            }
        };

        btnFlipPrimary.onClick = function () {
            var asc = rbPriAsc.value;
            rbPriAsc.value = !asc;
            rbPriDesc.value = asc;
        };

        btnFlipSecondary.onClick = function () {
            var asc = rbSecAsc.value;
            rbSecAsc.value = !asc;
            rbSecDesc.value = asc;
        };

        btnSort.onClick = doSort;

        btnHelp.onClick = function () {
            alert(
                "Sort Selected Layers by On-Screen Position (v3.1 Stable)\n\n" +
                "Primary axis/direction controls the main ordering.\n" +
                "Secondary breaks ties (unless Primary-bucket mode is enabled).\n\n" +
                "Tie tolerance (px): values within this distance are treated as equal on an axis.\n\n" +
                "Preserve stacking within PRIMARY buckets:\n" +
                "• If two layers share the same Primary value within tolerance,\n" +
                "  their original front-to-back order is preserved (Secondary is ignored).\n" +
                "• This is ideal for stacked bars (blue+tan) where you want left→right ordering\n" +
                "  but do NOT want segments to swap stacking order.\n\n" +
                "Notes:\n" +
                "• Locked layers can’t be reordered.\n" +
                "• Uses toComp(), so parenting / 3D / cameras are respected.\n" +
                "• Bounds center is best for Text/Shape.\n" +
                "• Uses a stable merge sort (Array.sort is not reliably stable in ExtendScript).\n"
            );
        };

        return pal;
    }

    var pal = buildUI(thisObj);
    if (pal instanceof Window) {
        pal.center();
        pal.show();
    } else {
        pal.layout.layout(true);
        pal.layout.resize();
    }

})(this);