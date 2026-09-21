import sanitizeHtmlPackage from 'sanitize-html';

const ALLOWED_TAGS = [
  'p', 'br', 'span', 'div',
  'b', 'strong', 'i', 'em', 'u', 's', 'strike', 'sub', 'sup', 'mark', 'small',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li', 'blockquote', 'pre', 'code',
  'a', 'img', 'figure', 'figcaption',
  'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption',
  'hr', 'details', 'summary',
];

const ALLOWED_ATTR = [
  'href', 'src', 'alt', 'title', 'target', 'rel', 'width', 'height',
  'colspan', 'rowspan', 'headers', 'scope',
];

const FORBIDDEN_ATTR = [
  'style', 'class', 'id', 'name',
  'onabort', 'onblur', 'onchange', 'onclick', 'ondblclick', 'onerror',
  'onfocus', 'onkeydown', 'onkeypress', 'onkeyup', 'onload', 'onmousedown',
  'onmousemove', 'onmouseout', 'onmouseover', 'onmouseup', 'onsubmit',
];

const SANITIZE_OPTIONS: sanitizeHtmlPackage.IOptions = {
  allowedTags: ALLOWED_TAGS,
  allowedAttributes: {
    '*': ALLOWED_ATTR,
  },
  disallowedTagsMode: 'discard',
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  allowProtocolRelative: false,
};

function escapeHtml(value: string): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Event-handler attributes (inline JS) must never survive sanitization even if
// the whitelist above is ever changed.
const FORBIDDEN_ATTR_RE = new RegExp(`^on[a-z]+$|^style$|^class$|^id$|^name$`, 'i');
const sanitizeOptionsHardened: sanitizeHtmlPackage.IOptions = {
  ...SANITIZE_OPTIONS,
  transformTags: {
    '*': (_tagName, attribs) => {
      const next: Record<string, string> = {};
      for (const [name, value] of Object.entries(attribs)) {
        if (FORBIDDEN_ATTR_RE.test(name) || FORBIDDEN_ATTR.includes(name.toLowerCase())) continue;
        next[name] = value;
      }
      return { tagName: _tagName, attribs: next };
    },
  },
};

export function sanitizeHtml(html: string): string {
  const input = typeof html === 'string' ? html : String(html ?? '');
  try {
    return sanitizeHtmlPackage(input, sanitizeOptionsHardened);
  } catch {
    try {
      return sanitizeHtmlPackage(input, SANITIZE_OPTIONS);
    } catch {
      // Absolute last resort: never return raw HTML to callers. Escaping keeps
      // the value inert so user-supplied markup cannot reach the page.
      return escapeHtml(input);
    }
  }
}