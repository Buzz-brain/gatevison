import { useState, useEffect } from "react";

export function useMountTransition(isMounted: boolean, delay = 150) {
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    if (isMounted && !shouldRender) {
      setShouldRender(true);
    } else if (!isMounted && shouldRender) {
      timeoutId = setTimeout(() => setShouldRender(false), delay);
    }

    return () => clearTimeout(timeoutId);
  }, [isMounted, delay, shouldRender]);

  return shouldRender;
}
