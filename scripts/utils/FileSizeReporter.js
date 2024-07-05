/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

"use strict";

import { readFileSync } from "fs";
import { join, basename, dirname, extname, sep } from "path";
import chalk from "chalk";
const { yellow, dim, cyan, red, green } = chalk;
import filesize from "filesize";
import recursive from "recursive-readdir";
import stripAnsi from "strip-ansi";
import { gzipSizeSync } from "gzip-size";

function canReadAsset(asset) {
  return (
    /\.(js|cjs|mjs|ts|json)$/.test(asset) &&
    !/service-worker\.js/.test(asset) &&
    !/precache-manifest\.[0-9a-f]+\.js/.test(asset)
  );
}

// Prints a detailed summary of build files.
export function printFileSizesAfterBuild(
  webpackStats,
  previousSizeMap,
  buildFolder,
  maxBundleGzipSize,
  maxChunkGzipSize
) {
  var root = previousSizeMap.root;
  var sizes = previousSizeMap.sizes;
  var assets = (webpackStats.stats || [webpackStats])
    .map((stats) =>
      stats
        .toJson({ all: false, assets: true })
        .assets.filter((asset) => canReadAsset(asset.name))
        .map((asset) => {
          var fileContents = readFileSync(join(root, asset.name));
          var size = gzipSizeSync(fileContents);
          var previousSize = sizes[removeFileNameHash(root, asset.name)];
          var difference = getDifferenceLabel(size, previousSize);
          return {
            folder: join(basename(buildFolder), dirname(asset.name)),
            name: basename(asset.name),
            size: size,
            sizeLabel: filesize(size) + (difference ? " (" + difference + ")" : ""),
          };
        })
    )
    .reduce((single, all) => all.concat(single), []);
  assets.sort((a, b) => b.size - a.size);
  var longestSizeLabelLength = Math.max.apply(
    null,
    assets.map((a) => stripAnsi(a.sizeLabel).length)
  );
  var suggestBundleSplitting = false;
  assets.forEach((asset) => {
    var sizeLabel = asset.sizeLabel;
    var sizeLength = stripAnsi(sizeLabel).length;
    if (sizeLength < longestSizeLabelLength) {
      var rightPadding = " ".repeat(longestSizeLabelLength - sizeLength);
      sizeLabel += rightPadding;
    }
    var isMainBundle = asset.name.indexOf("main.") === 0;
    var maxRecommendedSize = isMainBundle ? maxBundleGzipSize : maxChunkGzipSize;
    var isLarge = maxRecommendedSize && asset.size > maxRecommendedSize;
    if (isLarge && extname(asset.name) === ".js") {
      suggestBundleSplitting = true;
    }
    console.log("  " + (isLarge ? yellow(sizeLabel) : sizeLabel) + "  " + dim(asset.folder + sep) + cyan(asset.name));
  });
  if (suggestBundleSplitting) {
    console.log();
    console.log(yellow("The bundle size is significantly larger than recommended."));
    console.log(yellow("Consider reducing it with code splitting: https://goo.gl/9VhYWB"));
    console.log(yellow("You can also analyze the project dependencies: https://goo.gl/LeUzfb"));
  }
}

function removeFileNameHash(buildFolder, fileName) {
  return fileName
    .replace(buildFolder, "")
    .replace(/\\/g, "/")
    .replace(/\/?(.*)(\.[0-9a-f]+)(\.chunk)?(\.js|\.css)/, (match, p1, p2, p3, p4) => p1 + p4);
}

// Input: 1024, 2048
// Output: "(+1 KB)"
function getDifferenceLabel(currentSize, previousSize) {
  var FIFTY_KILOBYTES = 1024 * 50;
  var difference = currentSize - previousSize;
  var fileSize = !Number.isNaN(difference) ? filesize(difference) : 0;
  if (difference >= FIFTY_KILOBYTES) {
    return red("+" + fileSize);
  } else if (difference < FIFTY_KILOBYTES && difference > 0) {
    return yellow("+" + fileSize);
  } else if (difference < 0) {
    return green(fileSize);
  } else {
    return "";
  }
}

export function measureFileSizesBeforeBuild(buildFolder) {
  return new Promise((resolve) => {
    recursive(buildFolder, (err, fileNames) => {
      var sizes;
      if (!err && fileNames) {
        sizes = fileNames.filter(canReadAsset).reduce((memo, fileName) => {
          var contents = readFileSync(fileName);
          var key = removeFileNameHash(buildFolder, fileName);
          memo[key] = gzipSizeSync(contents);
          return memo;
        }, {});
      }
      resolve({
        root: buildFolder,
        sizes: sizes || {},
      });
    });
  });
}
