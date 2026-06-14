/**
 * @jest-environment node
 */
import { Platform } from "react-native";
import { applyTheme } from "../dark-mode";

function installFakeDocument(initialHasDark = false) {
  const classList = {
    classes: new Set<string>(initialHasDark ? ["dark"] : []),
    add: jest.fn(function (cls: string) { classList.classes.add(cls); }),
    remove: jest.fn(function (cls: string) { classList.classes.delete(cls); }),
  };
  const fakeDocument = {
    documentElement: { classList },
  };
  (globalThis as any).document = fakeDocument;
  return { classList, fakeDocument };
}

function uninstallFakeDocument() {
  delete (globalThis as any).document;
}

function setPlatform(os: typeof Platform.OS) {
  Object.defineProperty(Platform, "OS", { value: os, configurable: true, writable: false });
}

describe("applyTheme", () => {
  const originalOS = Platform.OS;

  afterEach(() => {
    setPlatform(originalOS);
    uninstallFakeDocument();
  });

  describe("on web", () => {
    beforeEach(() => {
      setPlatform("web");
    });

    test("adds 'dark' class when applying dark theme", () => {
      const { classList } = installFakeDocument(false);
      applyTheme("dark");
      expect(classList.add).toHaveBeenCalledWith("dark");
    });

    test("removes 'dark' class when applying light theme", () => {
      const { classList } = installFakeDocument(true);
      applyTheme("light");
      expect(classList.remove).toHaveBeenCalledWith("dark");
    });

    test("does not remove 'dark' when applying dark theme", () => {
      const { classList } = installFakeDocument(false);
      applyTheme("dark");
      expect(classList.remove).not.toHaveBeenCalled();
    });

    test("does not add 'dark' when applying light theme", () => {
      const { classList } = installFakeDocument(true);
      applyTheme("light");
      expect(classList.add).not.toHaveBeenCalled();
    });
  });

  describe("on native (iOS/Android)", () => {
    test("is a no-op on iOS even if document exists", () => {
      setPlatform("ios");
      const { classList } = installFakeDocument(false);
      applyTheme("dark");
      applyTheme("light");
      expect(classList.add).not.toHaveBeenCalled();
      expect(classList.remove).not.toHaveBeenCalled();
    });

    test("is a no-op on Android even if document exists", () => {
      setPlatform("android");
      const { classList } = installFakeDocument(false);
      applyTheme("dark");
      applyTheme("light");
      expect(classList.add).not.toHaveBeenCalled();
      expect(classList.remove).not.toHaveBeenCalled();
    });
  });
});
