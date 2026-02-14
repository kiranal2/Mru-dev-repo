export const cashAppTheme = {
  colors: {
    brand: {
      primary: "rgb(37, 99, 235)",
      primaryHover: "rgb(29, 78, 216)",
      primaryLight: "rgb(219, 234, 254)",
      primaryBorder: "rgb(147, 197, 253)",
    },
    semantic: {
      success: {
        bg: "rgb(240, 253, 244)",
        text: "rgb(22, 101, 52)",
        border: "rgb(187, 247, 208)",
        accent: "rgb(34, 197, 94)",
      },
      warning: {
        bg: "rgb(254, 252, 232)",
        text: "rgb(133, 77, 14)",
        border: "rgb(254, 240, 138)",
        accent: "rgb(234, 179, 8)",
      },
      danger: {
        bg: "rgb(254, 242, 242)",
        text: "rgb(153, 27, 27)",
        border: "rgb(254, 202, 202)",
        accent: "rgb(239, 68, 68)",
      },
      info: {
        bg: "rgb(241, 245, 249)",
        text: "rgb(51, 65, 85)",
        border: "rgb(203, 213, 225)",
        accent: "rgb(100, 116, 139)",
      },
    },
    neutral: {
      50: "rgb(248, 250, 252)",
      100: "rgb(241, 245, 249)",
      200: "rgb(226, 232, 240)",
      300: "rgb(203, 213, 225)",
      400: "rgb(148, 163, 184)",
      500: "rgb(100, 116, 139)",
      600: "rgb(71, 85, 105)",
      700: "rgb(51, 65, 85)",
      800: "rgb(30, 41, 59)",
      900: "rgb(15, 23, 42)",
    },
  },
  typography: {
    pageTitle: "text-xl font-semibold text-slate-900",
    sectionHeader: "text-sm font-semibold text-slate-700 uppercase tracking-wider",
    tableHeader: "text-xs font-semibold text-slate-600 uppercase tracking-wider",
    tableBody: "text-sm text-slate-700",
    tableBodyEmphasis: "text-sm font-semibold text-slate-900",
  },
  surfaces: {
    card: "bg-white border border-slate-200 rounded-lg shadow-sm",
    cardHover: "hover:shadow-md hover:border-slate-300 transition-all duration-150",
    elevated: "bg-white border border-slate-200 rounded-xl shadow-md",
  },
  spacing: {
    compact: {
      rowPadding: "py-2 px-3",
      cellPadding: "px-3 py-2",
      gap: "gap-2",
    },
    comfortable: {
      rowPadding: "py-3 px-4",
      cellPadding: "px-4 py-3",
      gap: "gap-3",
    },
  },
  transitions: {
    fast: "transition-all duration-150 ease-out",
    normal: "transition-all duration-200 ease-out",
    slow: "transition-all duration-300 ease-out",
  },
  focus: {
    ring: "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1",
  },
};

export type DensityMode = "compact" | "comfortable";

export const getDensityClasses = (density: DensityMode) => {
  return cashAppTheme.spacing[density];
};
