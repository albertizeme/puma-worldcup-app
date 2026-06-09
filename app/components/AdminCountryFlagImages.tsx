"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const regionalIndicatorStart = 0x1f1e6;
const regionalIndicatorEnd = 0x1f1ff;
const regionalFlagPattern = /([\u{1f1e6}-\u{1f1ff}]{2})/u;
const showTextNodes = 4;
const filterAccept = 1;
const filterReject = 2;

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

function createFlagImageSpan(flag: string) {
  const countryCode = flagToCountryCode(flag);

  if (!countryCode) return document.createTextNode(flag);

  const span = document.createElement("span");
  span.setAttribute("role", "img");
  span.setAttribute("aria-label", countryCode.toUpperCase());
  span.className = "mx-1 inline-block h-4 w-6 rounded-sm align-[-2px] shadow-sm";
  span.style.backgroundImage = `url(https://flagcdn.com/w40/${countryCode}.png)`;
  span.style.backgroundPosition = "center";
  span.style.backgroundRepeat = "no-repeat";
  span.style.backgroundSize = "cover";

  return span;
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

    fragment.append(createFlagImageSpan(nextMatch[0]));
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

    const walker = document.createTreeWalker(root, showTextNodes, {
      acceptNode(node) {
        const textNode = node as Text;
        const parentElement = textNode.parentElement;
        const text = textNode.nodeValue ?? "";

        if (!regionalFlagPattern.test(text)) return filterReject;
        if (!parentElement) return filterReject;
        if (parentElement.closest("script, style, select, option")) {
          return filterReject;
        }
        if (parentElement.closest("[data-admin-country-flag-enhanced]")) {
          return filterReject;
        }

        return filterAccept;
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
