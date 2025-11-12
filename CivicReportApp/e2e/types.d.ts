declare global {
  const device: {
    launchApp(): Promise<void>;
    terminateApp(): Promise<void>;
    reloadReactNative(): Promise<void>;
    takeScreenshot(name: string): Promise<void>;
    setURLBlacklist(urls: string[]): Promise<void>;
  };
  
  const element: (matcher: any) => {
    tap(): Promise<void>;
    typeText(text: string): Promise<void>;
  };
  
  const by: {
    id(id: string): any;
    text(text: string): any;
    type(type: string): any;
  };
  
  const expect: (element: any) => {
    toBeVisible(): Promise<void>;
    toExist(): Promise<void>;
    toHaveText(text: string): Promise<void>;
  };
  
  const waitFor: (element: any) => {
    toBeVisible(): {
      withTimeout(timeout: number): Promise<void>;
    };
  };
}

export {};