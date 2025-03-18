/* global chrome */
chrome.runtime.onInstalled.addListener(() => {
  // Open a new empty tab after the extension is installed
  chrome.tabs.create({});
});