import Script from "next/script";

export default function AdminCountryKpisLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <Script id="admin-country-flag-images" strategy="afterInteractive">
        {`
(function () {
  var pattern = /([\uD83C][\uDDE6-\uDDFF][\uD83C][\uDDE6-\uDDFF])/g;
  var start = 0x1f1e6;

  function flagToCode(flag) {
    var chars = Array.from(flag);
    if (chars.length !== 2) return null;

    var code = chars.map(function (character) {
      var point = character.codePointAt(0);
      if (!point || point < start || point > 0x1f1ff) return null;
      return String.fromCharCode(point - start + 65).toLowerCase();
    });

    if (code.some(function (part) { return !part; })) return null;
    return code.join('');
  }

  function createFlag(flag) {
    var code = flagToCode(flag);
    if (!code) return document.createTextNode(flag);

    var span = document.createElement('span');
    span.setAttribute('role', 'img');
    span.setAttribute('aria-label', code.toUpperCase());
    span.className = 'mx-1 inline-block h-4 w-6 rounded-sm align-[-2px] shadow-sm';
    span.style.backgroundImage = 'url(https://flagcdn.com/w40/' + code + '.png)';
    span.style.backgroundPosition = 'center';
    span.style.backgroundRepeat = 'no-repeat';
    span.style.backgroundSize = 'cover';
    return span;
  }

  function replaceNode(node) {
    var text = node.nodeValue || '';
    if (!pattern.test(text)) return;
    pattern.lastIndex = 0;

    var fragment = document.createDocumentFragment();
    var lastIndex = 0;
    var match;

    while ((match = pattern.exec(text)) !== null) {
      if (match.index > lastIndex) {
        fragment.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
      }

      fragment.appendChild(createFlag(match[0]));
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
    }

    if (node.parentNode) node.parentNode.replaceChild(fragment, node);
  }

  function enhanceFlags() {
    var root = document.querySelector('main');
    if (!root || root.dataset.countryFlagsEnhanced === 'true') return;

    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        var parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        if (parent.closest('script, style, select, option')) return NodeFilter.FILTER_REJECT;
        return pattern.test(node.nodeValue || '') ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });

    var nodes = [];
    var current = walker.nextNode();
    while (current) {
      nodes.push(current);
      current = walker.nextNode();
    }

    nodes.forEach(replaceNode);
    root.dataset.countryFlagsEnhanced = 'true';
  }

  enhanceFlags();
})();
        `}
      </Script>
    </>
  );
}
