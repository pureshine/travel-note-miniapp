interface IAppOption {
  globalData: {
    appName: string;
  };
}

declare const wx: WechatMiniprogram.Wx;
declare const App: WechatMiniprogram.App.Constructor;
declare const Page: WechatMiniprogram.Page.Constructor;
declare const getApp: WechatMiniprogram.GetApp;

declare namespace WechatMiniprogram {
  interface Wx {
    cloud?: Cloud;
    getStorageSync<T = unknown>(key: string): T;
    setStorageSync(key: string, data: unknown): void;
    removeStorageSync(key: string): void;
    showToast(options: { title: string; icon?: "success" | "error" | "loading" | "none"; duration?: number }): void;
    showModal(options: {
      title: string;
      content: string;
      confirmText?: string;
      confirmColor?: string;
      success?: (res: { confirm: boolean; cancel: boolean }) => void;
    }): void;
    showActionSheet(options: {
      itemList: string[];
      alertText?: string;
      success?: (res: { tapIndex: number }) => void;
    }): void;
    navigateTo(options: { url: string }): void;
    redirectTo(options: { url: string }): void;
    navigateBack(options?: { delta?: number }): void;
    switchTab(options: { url: string }): void;
    setNavigationBarTitle(options: { title: string }): void;
    setClipboardData(options: { data: string; success?: () => void }): void;
    chooseMedia(options: {
      count?: number;
      mediaType?: Array<"image" | "video">;
      sourceType?: Array<"album" | "camera">;
      success?: (res: { tempFiles: Array<{ tempFilePath: string }> }) => void;
      fail?: () => void;
    }): void;
    getFileSystemManager(): {
      accessSync(path: string): void;
    };
    login(options: { success?: (res: { code: string }) => void; fail?: () => void }): void;
  }

  interface Cloud {
    init(options: { env: string; traceUser?: boolean }): void;
    callFunction(options: {
      name: string;
      data?: Record<string, unknown>;
      success?: (res: { result: unknown }) => void;
      fail?: (error: { errMsg?: string }) => void;
    }): void;
    uploadFile(options: {
      cloudPath: string;
      filePath: string;
      success?: (res: { fileID: string; statusCode: number }) => void;
      fail?: (error: { errMsg?: string }) => void;
    }): void;
  }

  namespace App {
    interface Constructor {
      <T>(options: T & { globalData: IAppOption["globalData"]; onLaunch?: () => void }): void;
    }
  }

  namespace Page {
    interface Constructor {
      <T>(options: T): void;
    }
  }

  type GetApp = <T = IAppOption>() => T;
}
