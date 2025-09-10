// Simple test to verify Jest setup
describe('Jest Setup', () => {
  it('should run basic test', () => {
    expect(1 + 1).toBe(2);
  });

  it('should have access to DOM testing utilities', () => {
    const div = document.createElement('div');
    div.textContent = 'Hello World';
    expect(div.textContent).toBe('Hello World');
  });

  it('should have jest-dom matchers available', () => {
    const element = document.createElement('button');
    element.disabled = true;
    expect(element).toBeDisabled();
  });

  it('should mock console methods', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    console.log('test message');
    expect(consoleSpy).toHaveBeenCalledWith('test message');
    consoleSpy.mockRestore();
  });

  it('should have environment variables available', () => {
    expect(process.env.NODE_ENV).toBe('test');
  });
});