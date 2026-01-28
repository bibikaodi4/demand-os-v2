"use client"
import { useEffect } from "react";

export default function DebugHydration() {
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === 'attributes' && m.target === document.body) {
          const attrName = (m as MutationRecord).attributeName;
          if (attrName && attrName.startsWith('data-')) {
            // Log full attribute and stack to help trace origin
            console.warn('Body attribute changed:', attrName, document.body.getAttribute(attrName));
            console.warn(new Error('Attribute mutation stack').stack);
          }
        }
      }
    });

    observer.observe(document.body, { attributes: true });

    // also detect existing unexpected attributes at mount
    for (const attr of Array.from(document.body.attributes)) {
      if (attr.name.startsWith('data-')) {
        console.info('Existing body data- attribute at mount:', attr.name, attr.value);
      }
    }

    return () => observer.disconnect();
  }, []);

  return null;
}
