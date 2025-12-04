/**
 * .edu Email Validation Service
 * Validates college email addresses and extracts college information
 */

interface CollegeInfo {
  id: string;
  name: string;
  domain: string;
  type: 'liberal_arts' | 'university' | 'community_college';
  state: string;
  isElite: boolean;
  verified: boolean;
}

// Elite Liberal Arts Colleges Database
export const ELITE_COLLEGES: Record<string, CollegeInfo> = {
  'amherst.edu': {
    id: 'amherst',
    name: 'Amherst College',
    domain: 'amherst.edu',
    type: 'liberal_arts',
    state: 'MA',
    isElite: true,
    verified: true
  },
  'williams.edu': {
    id: 'williams',
    name: 'Williams College',
    domain: 'williams.edu',
    type: 'liberal_arts',
    state: 'MA',
    isElite: true,
    verified: true
  },
  'swarthmore.edu': {
    id: 'swarthmore',
    name: 'Swarthmore College',
    domain: 'swarthmore.edu',
    type: 'liberal_arts',
    state: 'PA',
    isElite: true,
    verified: true
  },
  'pomona.edu': {
    id: 'pomona',
    name: 'Pomona College',
    domain: 'pomona.edu',
    type: 'liberal_arts',
    state: 'CA',
    isElite: true,
    verified: true
  },
  'wellesley.edu': {
    id: 'wellesley',
    name: 'Wellesley College',
    domain: 'wellesley.edu',
    type: 'liberal_arts',
    state: 'MA',
    isElite: true,
    verified: true
  },
  'middlebury.edu': {
    id: 'middlebury',
    name: 'Middlebury College',
    domain: 'middlebury.edu',
    type: 'liberal_arts',
    state: 'VT',
    isElite: true,
    verified: true
  },
  'bowdoin.edu': {
    id: 'bowdoin',
    name: 'Bowdoin College',
    domain: 'bowdoin.edu',
    type: 'liberal_arts',
    state: 'ME',
    isElite: true,
    verified: true
  },
  'carleton.edu': {
    id: 'carleton',
    name: 'Carleton College',
    domain: 'carleton.edu',
    type: 'liberal_arts',
    state: 'MN',
    isElite: true,
    verified: true
  },
  'davidson.edu': {
    id: 'davidson',
    name: 'Davidson College',
    domain: 'davidson.edu',
    type: 'liberal_arts',
    state: 'NC',
    isElite: true,
    verified: true
  },
  'haverford.edu': {
    id: 'haverford',
    name: 'Haverford College',
    domain: 'haverford.edu',
    type: 'liberal_arts',
    state: 'PA',
    isElite: true,
    verified: true
  },
  'colby.edu': {
    id: 'colby',
    name: 'Colby College',
    domain: 'colby.edu',
    type: 'liberal_arts',
    state: 'ME',
    isElite: true,
    verified: true
  },
  'hamilton.edu': {
    id: 'hamilton',
    name: 'Hamilton College',
    domain: 'hamilton.edu',
    type: 'liberal_arts',
    state: 'NY',
    isElite: true,
    verified: true
  },
  'vassar.edu': {
    id: 'vassar',
    name: 'Vassar College',
    domain: 'vassar.edu',
    type: 'liberal_arts',
    state: 'NY',
    isElite: true,
    verified: true
  },
  'grinnell.edu': {
    id: 'grinnell',
    name: 'Grinnell College',
    domain: 'grinnell.edu',
    type: 'liberal_arts',
    state: 'IA',
    isElite: true,
    verified: true
  },
  'wesleyan.edu': {
    id: 'wesleyan',
    name: 'Wesleyan University',
    domain: 'wesleyan.edu',
    type: 'liberal_arts',
    state: 'CT',
    isElite: true,
    verified: true
  },
  'colgate.edu': {
    id: 'colgate',
    name: 'Colgate University',
    domain: 'colgate.edu',
    type: 'liberal_arts',
    state: 'NY',
    isElite: true,
    verified: true
  },
  'bates.edu': {
    id: 'bates',
    name: 'Bates College',
    domain: 'bates.edu',
    type: 'liberal_arts',
    state: 'ME',
    isElite: true,
    verified: true
  },
  'macalester.edu': {
    id: 'macalester',
    name: 'Macalester College',
    domain: 'macalester.edu',
    type: 'liberal_arts',
    state: 'MN',
    isElite: true,
    verified: true
  },
  'oberlin.edu': {
    id: 'oberlin',
    name: 'Oberlin College',
    domain: 'oberlin.edu',
    type: 'liberal_arts',
    state: 'OH',
    isElite: true,
    verified: true
  },
  'claremont.edu': {
    id: 'claremont',
    name: 'Claremont McKenna College',
    domain: 'claremont.edu',
    type: 'liberal_arts',
    state: 'CA',
    isElite: true,
    verified: true
  }
};

/**
 * Validates if an email address is from a supported college
 */
export function validateCollegeEmail(email: string): {
  isValid: boolean;
  college?: CollegeInfo;
  error?: string;
} {
  if (!email || typeof email !== 'string') {
    return {
      isValid: false,
      error: 'Invalid email address'
    };
  }

  const normalizedEmail = email.toLowerCase().trim();
  const domain = normalizedEmail.split('@')[1];

  if (!domain) {
    return {
      isValid: false,
      error: 'Invalid email format'
    };
  }

  // Check if domain ends with .edu
  if (!domain.endsWith('.edu')) {
    return {
      isValid: false,
      error: 'Only .edu email addresses are allowed'
    };
  }

  // Check if it's a supported elite college
  const college = ELITE_COLLEGES[domain];
  if (!college) {
    return {
      isValid: false,
      error: 'Your college is not currently supported. poolUp is available for select liberal arts colleges.'
    };
  }

  return {
    isValid: true,
    college
  };
}

/**
 * Extracts college information from a validated email
 */
export function getCollegeFromEmail(email: string): CollegeInfo | null {
  const validation = validateCollegeEmail(email);
  return validation.isValid ? validation.college! : null;
}

/**
 * Gets user's college status and information
 */
export function getCollegeStatus(email: string) {
  const college = getCollegeFromEmail(email);
  
  if (!college) {
    return {
      isStudent: false,
      college: null,
      canAccessApp: false
    };
  }

  return {
    isStudent: true,
    college,
    canAccessApp: college.verified
  };
}

/**
 * Validates email in real-time for form inputs
 */
export function validateEmailInput(email: string): {
  isValid: boolean;
  message?: string;
  type?: 'error' | 'warning' | 'success';
} {
  if (!email) {
    return { isValid: false };
  }

  if (!email.includes('@')) {
    return { isValid: false };
  }

  const validation = validateCollegeEmail(email);
  
  if (!validation.isValid) {
    return {
      isValid: false,
      message: validation.error,
      type: 'error'
    };
  }

  return {
    isValid: true,
    message: `Welcome, ${validation.college!.name} student!`,
    type: 'success'
  };
}

/**
 * Get all supported colleges for display
 */
export function getSupportedColleges(): CollegeInfo[] {
  return Object.values(ELITE_COLLEGES).sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Search colleges by name for admin/support features
 */
export function searchColleges(query: string): CollegeInfo[] {
  const normalizedQuery = query.toLowerCase();
  return getSupportedColleges().filter(college => 
    college.name.toLowerCase().includes(normalizedQuery) ||
    college.domain.toLowerCase().includes(normalizedQuery)
  );
}