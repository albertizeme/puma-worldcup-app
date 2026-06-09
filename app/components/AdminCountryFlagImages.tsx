"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const regionalIndicatorStart = 0x1f1e6;
const regionalIndicatorEnd = 0x1f1ff;
const regionalFlagPattern = /([\u{1f1e6}-\u{1f1ff}]{2})/u;

function flagToCountryCode(flag: string) {
  const codePoints = Array.from(flag).map((character) =>
    character.codePointAt(0)
  );

  if (
    codePoints.length !== 2 ||
    codePoints.some(
      (codePoint) =>
        !codePoint ||
        codePoint < regionalIndicatorStart ||
        codePoint > regionalIndicatorEnd
    )
  ) {
    return null;
  }

  return codePoints
    .map((codePoint) =>
      String.fromCharCode(codePoint - regionalIndicatorStart + 65)
    )
    .join("")
    .toLowerCase();
}

function createFlagImage(flag: string) {
  const countryCode = flagToCountryCode(flag);

  if (!countryCode) return document.createTextNode(flag);

  const image = document.createElement("img");
  image.src = `https://flagcdn.com/w40/${countryCode}.png`;
  image.srcset = `https://flagcdn.com/w80/${countryCode}.png 2x`;
  image.alt = countryCode.toUpperCase();
  image.loading = "lazy";
  image.className = "mx-1 inline-block h-4 w-6 rounded-sm object-cover align-[-2px] shadow-sm";

  return image;
}

function replaceFlagTextNode(textNode: Text) {
  const text = textNode.nodeValue ?? "";
  const match = text.match(regionalFlagPattern);

  if (!match?.[0]) return;

  const fragment = document.createDocumentFragment();
  let remainingText = text;

  while (remainingText) {
    const nextMatch = remainingText.match(regionalFlagPattern);

    if (!nextMatch?.[0] || typeof nextMatch.index !== "number") {
      fragment.append(document.createTextNode(remainingText));
      break;
    }

    const before = remainingText.slice(0, nextMatch.index);
    if (before) fragment.append(document.createTextNode(before));

    fragment.append(createFlagImage(nextMatch[0]));
    remainingText = remainingText.slice(nextMatch.index + nextMatch[0].length);
  }

  textNode.parentNode?.replaceChild(fragment, textNode);
}

export default function AdminCountryFlagImages() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname.includes("/admin/kpis/country")) return;

    const root = document.querySelector("main");
    if (!root) return;

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const parentElement = node.parentElement;
        const text = node.nodeValue ?? "";

        if (!regionalFlagPattern.test(text)) return NodeFilter.FILTER_REJECT;
        if (!parentElement) return NodeFilter.FILTER_REJECT;
        if (parentElement.closest("script, style, select, option")) {
          return NodeFilter.FILTER_REJECT;
        }
        if (parentElement.closest("[data-admin-country-flag-enhanced]")) {
          return NodeFilter.FILTER_REJECT;
        }

        return NodeFilter.FILTER_ACCEPT;
      },
    });

    const nodes: Text[] = [];
    let currentNode = walker.nextNode();

    while (currentNode) {
      nodes.push(currentNode as Text);
      currentNode = walker.nextNode();
    }

    nodes.forEach((node) => {
      const wrapper = node.parentElement;
      replaceFlagTextNode(node);
      wrapper?.setAttribute("data-admin-country-flag-enhanced", "true");
    });
  }, [pathname]);

  return null;
}
