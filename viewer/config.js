window.config = {
  name: "RadRepPilot OHIF 3.11.1",
  routerBasename: "/ohif",
  extensions: [],
  modes: [],
  showStudyList: false,
  showLoadingIndicator: true,
  showErrorDetails: "always",
  maxNumberOfWebWorkers: 2,
  showCPUFallbackMessage: true,
  showWarningMessageForCrossOrigin: true,
  strictZSpacingForVolumeViewport: true,
  defaultDataSourceName: "dicomjson",
  dataSources: [
    {
      namespace: "@ohif/extension-default.dataSourcesModule.dicomjson",
      sourceName: "dicomjson",
      configuration: {
        friendlyName: "RadRepPilot curated study",
        name: "dicomjson",
      },
    },
  ],
  hotkeys: [
    {
      commandName: "incrementActiveViewport",
      label: "Next image",
      keys: ["down"],
    },
    {
      commandName: "decrementActiveViewport",
      label: "Previous image",
      keys: ["up"],
    },
  ],
  customizationService: {},
};
