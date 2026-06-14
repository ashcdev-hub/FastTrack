import { render, act } from "@testing-library/react-native";
import React, { useEffect } from "react";
import { useToast } from "../useToast";

type ToastHook = ReturnType<typeof useToast>;

function ToastHarness({
  durationMs,
  captureRef,
}: {
  durationMs: number;
  captureRef: { current: ToastHook | null };
}) {
  const hook = useToast(durationMs);
  useEffect(() => {
    captureRef.current = hook;
  });
  return null;
}

function wait(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

describe("useToast", () => {
  let captureRef: { current: ToastHook | null };

  beforeEach(() => {
    captureRef = { current: null };
  });

  async function setup(durationMs = 3000) {
    await render(
      <ToastHarness durationMs={durationMs} captureRef={captureRef} />
    );
  }

  function getHook(): ToastHook {
    if (!captureRef.current) throw new Error("Hook not initialised");
    return captureRef.current;
  }

  test("starts hidden with no message", async () => {
    await setup();
    expect(getHook().toast.visible).toBe(false);
    expect(getHook().toast.message).toBe("");
    expect(getHook().toast.type).toBe("success");
  });

  test("show() makes toast visible with success type by default", async () => {
    await setup();
    await act(async () => {
      getHook().show("Saved");
    });
    expect(getHook().toast.visible).toBe(true);
    expect(getHook().toast.message).toBe("Saved");
    expect(getHook().toast.type).toBe("success");
  });

  test("show() with 'error' sets type to error", async () => {
    await setup();
    await act(async () => {
      getHook().show("Something broke", "error");
    });
    expect(getHook().toast.type).toBe("error");
    expect(getHook().toast.message).toBe("Something broke");
  });

  test("success() shorthand sets type to success", async () => {
    await setup();
    await act(async () => {
      getHook().success("All good");
    });
    expect(getHook().toast.type).toBe("success");
    expect(getHook().toast.message).toBe("All good");
    expect(getHook().toast.visible).toBe(true);
  });

  test("error() shorthand sets type to error", async () => {
    await setup();
    await act(async () => {
      getHook().error("Oops");
    });
    expect(getHook().toast.type).toBe("error");
    expect(getHook().toast.message).toBe("Oops");
    expect(getHook().toast.visible).toBe(true);
  });

  test("auto-dismisses after durationMs", async () => {
    await setup(50);
    await act(async () => {
      getHook().show("Will fade");
    });
    expect(getHook().toast.visible).toBe(true);

    await act(async () => {
      await wait(75);
    });
    expect(getHook().toast.visible).toBe(false);
    expect(getHook().toast.message).toBe("");
  });

  test("successive show() calls reset the auto-dismiss timer", async () => {
    await setup(100);
    await act(async () => {
      getHook().show("First");
    });

    await act(async () => {
      await wait(75);
    });

    await act(async () => {
      getHook().show("Second");
    });

    await act(async () => {
      await wait(75);
    });
    // First timer would have fired by now, but second show reset it
    expect(getHook().toast.visible).toBe(true);
    expect(getHook().toast.message).toBe("Second");

    await act(async () => {
      await wait(50);
    });
    // Past the 100ms deadline for the second show
    expect(getHook().toast.visible).toBe(false);
  });
});
