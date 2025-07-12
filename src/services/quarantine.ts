import { FirewallClient } from './firewall-client.js';

/**
 * Policy violation interface
 */
export interface PolicyViolation {
  policyId?: string;
  policyName?: string;
  threatLevel?: number;
  constraintViolations?: any[];
}

/**
 * Quarantined component interface
 */
export interface QuarantinedComponent {
  packageUrl?: string;
  hash?: string;
  componentIdentifier?: {
    format?: string;
    coordinates?: Record<string, any>;
  };
  displayName?: string;
  quarantineDate?: string;
  policyViolations?: PolicyViolation[];
  quarantineId?: string;
}

/**
 * Repository quarantine summary interface
 */
export interface RepositoryQuarantineSummary {
  repository?: string;
  componentsInQuarantine?: number;
  components?: QuarantinedComponent[];
}

/**
 * Quarantine response interface
 */
export interface QuarantineResponse {
  repositoryQuarantineSummary?: RepositoryQuarantineSummary[];
}

/**
 * Release quarantine request interface
 */
export interface ReleaseQuarantineRequest {
  comment?: string;
}

/**
 * Release quarantine response interface
 */
export interface ReleaseQuarantineResponse {
  quarantineId?: string;
  component?: QuarantinedComponent;
  waivedPolicyViolations?: PolicyViolation[];
  releaseDate?: string;
}

/**
 * Quarantine service for Sonatype Firewall operations
 */
export class QuarantineService {
  constructor(private firewallClient: FirewallClient) {}

  /**
   * Get all quarantined components across repositories
   */
  async getQuarantinedComponents(purl?: string): Promise<QuarantineResponse> {
    const params: Record<string, string> = {};
    if (purl) {
      params.purl = purl;
    }

    const response = await this.firewallClient.get<QuarantineResponse>(
      '/api/v2/reports/components/quarantined',
      { params }
    );
    return response;
  }

  /**
   * Release a component from quarantine
   */
  async releaseFromQuarantine(
    quarantineId: string, 
    request: ReleaseQuarantineRequest = {}
  ): Promise<ReleaseQuarantineResponse> {
    const response = await this.firewallClient.post<ReleaseQuarantineResponse>(
      `/api/v2/repositories/quarantine/${encodeURIComponent(quarantineId)}/release`,
      request
    );
    return response;
  }

  /**
   * Get quarantined components for a specific repository
   */
  async getQuarantinedComponentsByRepository(repositoryName: string): Promise<RepositoryQuarantineSummary | null> {
    const allQuarantined = await this.getQuarantinedComponents();
    
    if (!allQuarantined.repositoryQuarantineSummary) {
      return null;
    }

    const repoSummary = allQuarantined.repositoryQuarantineSummary.find(
      repo => repo.repository === repositoryName
    );
    
    return repoSummary || null;
  }

  /**
   * Search quarantined components by package URL pattern
   */
  async searchQuarantinedComponents(purlPattern: string): Promise<QuarantinedComponent[]> {
    const allQuarantined = await this.getQuarantinedComponents();
    
    if (!allQuarantined.repositoryQuarantineSummary) {
      return [];
    }

    const matchingComponents: QuarantinedComponent[] = [];
    
    for (const repoSummary of allQuarantined.repositoryQuarantineSummary) {
      if (repoSummary.components) {
        const filtered = repoSummary.components.filter(component => 
          component.packageUrl?.toLowerCase().includes(purlPattern.toLowerCase()) ||
          component.displayName?.toLowerCase().includes(purlPattern.toLowerCase())
        );
        matchingComponents.push(...filtered);
      }
    }
    
    return matchingComponents;
  }
}