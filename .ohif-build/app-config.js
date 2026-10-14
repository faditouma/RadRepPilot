window.config = {
  name: "RadRepPilot OHIF 3.11.1",
  routerBasename: "/ohif",
  extensions: [],
  modes: [],
  modesConfiguration: {
    "@ohif/mode-longitudinal": {
      routes: [
        {
          path: "longitudinal",
          layoutTemplate: () => ({
            id: "@ohif/extension-default.layoutTemplateModule.viewerLayout",
            props: {
              leftPanels: [
                "@ohif/extension-measurement-tracking.panelModule.seriesList",
              ],
              leftPanelClosed: true,
              leftPanelResizable: true,
              rightPanels: [],
              rightPanelClosed: true,
              viewports: [
                {
                  namespace:
                    "@ohif/extension-measurement-tracking.viewportModule.cornerstone-tracked",
                  displaySetsToDisplay: [
                    "@ohif/extension-default.sopClassHandlerModule.stack",
                  ],
                },
              ],
            },
          }),
        },
      ],
    },
  },
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
