describe('Civic Report App E2E', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  afterAll(async () => {
    await device.terminateApp();
  });

  it('should show home screen after launch', async () => {
    await expect(element(by.id('home-screen'))).toBeVisible();
  });

  it('should be able to navigate to report screen', async () => {
    await element(by.id('report-button')).tap();
    await expect(element(by.id('report-screen'))).toBeVisible();
  });

  it('should be able to take a photo for report', async () => {
    await element(by.id('report-button')).tap();
    await element(by.id('camera-button')).tap();
    await device.takeScreenshot('camera-opened');
  });

  it('should show location permission dialog', async () => {
    await element(by.id('location-button')).tap();
    // Wait for permission dialog
    await waitFor(element(by.text('Location Permission')))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('should display recent reports', async () => {
    await element(by.id('recent-reports-tab')).tap();
    await expect(element(by.id('reports-list'))).toBeVisible();
  });

  it('should handle network errors gracefully', async () => {
    await device.setURLBlacklist(['**/api/**']);
    await element(by.id('refresh-button')).tap();
    await expect(element(by.text('Network Error'))).toBeVisible();
    await device.setURLBlacklist([]);
  });
});