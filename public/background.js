/* global chrome */
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(["firstInstallCompleted"], function (result) {
    // Open a new empty tab after the extension is installed for first time
    if (!result.firstInstallCompleted) {
      chrome.tabs.create({});

      chrome.storage.local.set({ firstInstallCompleted: true }, function () {
        console.log("Extension installed for the first time.");
      });
    }
  });
});
