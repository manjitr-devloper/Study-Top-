// Google Classroom API Client Service (1P Google Workspace Integration)
import { getAccessToken } from './firebase';

export interface ClassroomCourse {
  id: string;
  name: string;
  section?: string;
  descriptionHeading?: string;
  room?: string;
  ownerId?: string;
  courseState: string;
  alternateLink?: string;
  enrollmentCode?: string;
  teacherGroupEmail?: string;
}

export interface ClassroomCourseWork {
  id: string;
  title: string;
  description?: string;
  materials?: any[];
  state: string;
  alternateLink?: string;
  creationTime: string;
  updateTime: string;
  dueDate?: {
    year: number;
    month: number;
    day: number;
  };
  dueTime?: {
    hours?: number;
    minutes?: number;
  };
  maxPoints?: number;
  workType?: string;
}

export interface ClassroomAnnouncement {
  id: string;
  text: string;
  materials?: any[];
  state: string;
  alternateLink?: string;
  creationTime: string;
  updateTime: string;
}

class GoogleClassroomService {
  private baseUrl = 'https://classroom.googleapis.com/v1';

  private async getAuthHeaders(): Promise<HeadersInit> {
    const token = await getAccessToken();
    if (!token) {
      throw new Error('Google Classroom authorization token not available. Please sign in with Google to grant Classroom permissions.');
    }
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  // List all courses user is enrolled in or teaches
  async listCourses(): Promise<ClassroomCourse[]> {
    try {
      const headers = await this.getAuthHeaders();
      const res = await fetch(`${this.baseUrl}/courses?courseStates=ACTIVE`, { headers });
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          throw new Error('Classroom permissions required. Please reconnect Google Account.');
        }
        throw new Error(`Failed to load Google Classroom courses (${res.status})`);
      }
      const data = await res.json();
      return data.courses || [];
    } catch (e: any) {
      console.warn('Classroom listCourses warning:', e?.message);
      throw e;
    }
  }

  // List assignments & questions for a course
  async listCourseWork(courseId: string): Promise<ClassroomCourseWork[]> {
    try {
      const headers = await this.getAuthHeaders();
      const res = await fetch(`${this.baseUrl}/courses/${courseId}/courseWork?courseWorkStates=PUBLISHED`, { headers });
      if (!res.ok) {
        throw new Error(`Failed to load course assignments (${res.status})`);
      }
      const data = await res.json();
      return data.courseWork || [];
    } catch (e: any) {
      console.warn('Classroom listCourseWork warning:', e?.message);
      throw e;
    }
  }

  // List announcements for a course
  async listAnnouncements(courseId: string): Promise<ClassroomAnnouncement[]> {
    try {
      const headers = await this.getAuthHeaders();
      const res = await fetch(`${this.baseUrl}/courses/${courseId}/announcements?announcementStates=PUBLISHED`, { headers });
      if (!res.ok) {
        throw new Error(`Failed to load announcements (${res.status})`);
      }
      const data = await res.json();
      return data.announcements || [];
    } catch (e: any) {
      console.warn('Classroom listAnnouncements warning:', e?.message);
      throw e;
    }
  }

  // List materials for a course
  async listCourseMaterials(courseId: string): Promise<any[]> {
    try {
      const headers = await this.getAuthHeaders();
      const res = await fetch(`${this.baseUrl}/courses/${courseId}/courseWorkMaterials?courseWorkMaterialStates=PUBLISHED`, { headers });
      if (!res.ok) {
        throw new Error(`Failed to load course materials (${res.status})`);
      }
      const data = await res.json();
      return data.courseWorkMaterial || [];
    } catch (e: any) {
      console.warn('Classroom listCourseMaterials warning:', e?.message);
      throw e;
    }
  }
}

export const googleClassroomService = new GoogleClassroomService();
