import { UserRole } from "./auth-context";

export type SoxStage = "DRAFT" | "PREPARED" | "IN_REVIEW" | "APPROVED" | "POSTED_LOCKED";

export const SOX_STAGE_FLOW: SoxStage[] = [
  "DRAFT",
  "PREPARED",
  "IN_REVIEW",
  "APPROVED",
  "POSTED_LOCKED",
];

export interface StagePermissions {
  canView: boolean;
  canEdit: boolean;
  canAdvance: boolean;
  canAssignRoles: boolean;
  canAddEvidence: boolean;
  canReview: boolean;
  canApprove: boolean;
  canPostLock: boolean;
  canReject: boolean;
}

export function getPermissionsForStage(
  userRole: UserRole,
  currentStage: SoxStage,
  isAssigned: boolean = false
): StagePermissions {
  const permissions: StagePermissions = {
    canView: false,
    canEdit: false,
    canAdvance: false,
    canAssignRoles: false,
    canAddEvidence: false,
    canReview: false,
    canApprove: false,
    canPostLock: false,
    canReject: false,
  };

  // ADMIN has all permissions
  if (userRole === "ADMIN") {
    return {
      canView: true,
      canEdit: true,
      canAdvance: true,
      canAssignRoles: true,
      canAddEvidence: true,
      canReview: true,
      canApprove: true,
      canPostLock: true,
      canReject: true,
    };
  }

  // CFO has view-only access to everything
  if (userRole === "CFO") {
    return {
      canView: true,
      canEdit: false,
      canAdvance: false,
      canAssignRoles: false,
      canAddEvidence: false,
      canReview: false,
      canApprove: false,
      canPostLock: false,
      canReject: false,
    };
  }

  // Everyone can view
  permissions.canView = true;

  // PREPARER permissions
  if (userRole === "PREPARER") {
    if (currentStage === "DRAFT") {
      permissions.canEdit = true;
      permissions.canAdvance = true;
      permissions.canAssignRoles = true;
      permissions.canAddEvidence = true;
    } else if (currentStage === "PREPARED") {
      permissions.canEdit = true;
      permissions.canAddEvidence = true;
      permissions.canAdvance = true; // Can submit for review
    }
  }

  // REVIEWER permissions
  if (userRole === "REVIEWER") {
    if (currentStage === "IN_REVIEW") {
      permissions.canReview = true;
      permissions.canAddEvidence = true;
      permissions.canApprove = true; // Can approve or reject
      permissions.canAdvance = true; // Can advance to APPROVED
      permissions.canReject = true;
    }
  }

  // APPROVER permissions
  if (userRole === "APPROVER") {
    if (currentStage === "IN_REVIEW") {
      permissions.canReview = true;
      permissions.canApprove = true;
      permissions.canAdvance = true; // Can advance to APPROVED
      permissions.canReject = true;
    } else if (currentStage === "APPROVED") {
      permissions.canView = true;
    }
  }

  // CONTROLLER permissions
  if (userRole === "CONTROLLER") {
    if (currentStage === "APPROVED") {
      permissions.canPostLock = true;
      permissions.canAddEvidence = true;
    } else if (currentStage === "POSTED_LOCKED") {
      permissions.canView = true;
    }
    // Controller can view all stages
    permissions.canView = true;
  }

  return permissions;
}

export function canUserAdvanceStage(
  userRole: UserRole,
  fromStage: SoxStage,
  toStage: SoxStage
): boolean {
  if (userRole === "ADMIN") return true;

  const transitions: Record<UserRole, Record<SoxStage, SoxStage[]>> = {
    PREPARER: {
      DRAFT: ["PREPARED"],
      PREPARED: ["IN_REVIEW"],
      IN_REVIEW: [],
      APPROVED: [],
      POSTED_LOCKED: [],
    },
    REVIEWER: {
      DRAFT: [],
      PREPARED: [],
      IN_REVIEW: ["APPROVED", "PREPARED"], // Can approve or reject
      APPROVED: [],
      POSTED_LOCKED: [],
    },
    APPROVER: {
      DRAFT: [],
      PREPARED: [],
      IN_REVIEW: ["APPROVED", "PREPARED"], // Can approve or reject
      APPROVED: [],
      POSTED_LOCKED: [],
    },
    CONTROLLER: {
      DRAFT: [],
      PREPARED: [],
      IN_REVIEW: [],
      APPROVED: ["POSTED_LOCKED"],
      POSTED_LOCKED: [],
    },
    CFO: {
      DRAFT: [],
      PREPARED: [],
      IN_REVIEW: [],
      APPROVED: [],
      POSTED_LOCKED: [],
    },
    ADMIN: {
      DRAFT: ["PREPARED", "IN_REVIEW", "APPROVED", "POSTED_LOCKED"],
      PREPARED: ["DRAFT", "IN_REVIEW", "APPROVED", "POSTED_LOCKED"],
      IN_REVIEW: ["DRAFT", "PREPARED", "APPROVED", "POSTED_LOCKED"],
      APPROVED: ["DRAFT", "PREPARED", "IN_REVIEW", "POSTED_LOCKED"],
      POSTED_LOCKED: ["DRAFT", "PREPARED", "IN_REVIEW", "APPROVED"],
    },
  };

  const allowedTransitions = transitions[userRole]?.[fromStage] || [];
  return allowedTransitions.includes(toStage);
}

export function getStageDisplayInfo(stage: SoxStage): {
  label: string;
  color: string;
  description: string;
  requiredRole: UserRole[];
} {
  const stageInfo: Record<
    SoxStage,
    {
      label: string;
      color: string;
      description: string;
      requiredRole: UserRole[];
    }
  > = {
    DRAFT: {
      label: "Draft",
      color: "gray",
      description: "Initial preparation in progress",
      requiredRole: ["PREPARER"],
    },
    PREPARED: {
      label: "Prepared",
      color: "blue",
      description: "Prepared and ready for review",
      requiredRole: ["PREPARER"],
    },
    IN_REVIEW: {
      label: "In Review",
      color: "yellow",
      description: "Under review by reviewer/approver",
      requiredRole: ["REVIEWER", "APPROVER"],
    },
    APPROVED: {
      label: "Approved",
      color: "green",
      description: "Approved and ready to post",
      requiredRole: ["CONTROLLER"],
    },
    POSTED_LOCKED: {
      label: "Posted & Locked",
      color: "purple",
      description: "Posted and locked, no further changes",
      requiredRole: [],
    },
  };

  return stageInfo[stage];
}

export function getRoleDisplayInfo(role: UserRole): {
  label: string;
  color: string;
  description: string;
} {
  const roleInfo: Record<UserRole, { label: string; color: string; description: string }> = {
    PREPARER: {
      label: "Preparer",
      color: "blue",
      description: "Prepares tasks and reconciliations",
    },
    REVIEWER: {
      label: "Reviewer",
      color: "orange",
      description: "Reviews and provides feedback",
    },
    APPROVER: {
      label: "Approver",
      color: "green",
      description: "Final approval authority",
    },
    CONTROLLER: {
      label: "Controller",
      color: "purple",
      description: "Posts and locks approved items",
    },
    CFO: {
      label: "CFO",
      color: "slate",
      description: "Executive oversight with read-only access",
    },
    ADMIN: {
      label: "Admin",
      color: "red",
      description: "System administrator with full access",
    },
  };

  return roleInfo[role];
}
