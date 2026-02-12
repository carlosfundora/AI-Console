from playwright.sync_api import sync_playwright

def verify_dashboard():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            print("Navigating to dashboard...")
            page.goto("http://localhost:3000")

            # Wait for the dashboard content to load
            print("Waiting for dashboard content...")
            page.wait_for_selector("text=Recent System Alerts", timeout=10000)

            # Take a screenshot
            print("Taking screenshot...")
            page.screenshot(path="verification_dashboard.png")
            print("Screenshot saved to verification_dashboard.png")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_dashboard()
