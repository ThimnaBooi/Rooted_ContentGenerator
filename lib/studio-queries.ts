import { supabase } from '@/lib/supabase-client';
import type {
  StudioDocument,
  StudioDocumentVersion,
  StudioImage,
  StudioProject,
  StudioProjectItem,
  StudioFolder,
  StudioTemplate,
} from '@/lib/studio-types';

// ---------- Folders ----------
export async function getFolders(): Promise<StudioFolder[]> {
  const { data, error } = await supabase
    .from('studio_folders')
    .select('*')
    .order('name');
  if (error) throw error;
  return data ?? [];
}

export async function createFolder(name: string): Promise<StudioFolder> {
  const { data, error } = await supabase
    .from('studio_folders')
    .insert({ name })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteFolder(id: string): Promise<void> {
  const { error } = await supabase.from('studio_folders').delete().eq('id', id);
  if (error) throw error;
}

// ---------- Documents ----------
export async function getDocuments(folderId?: string | null): Promise<StudioDocument[]> {
  let q = supabase.from('studio_documents').select('*').order('updated_at', { ascending: false });
  if (folderId !== undefined) {
    q = folderId === null ? q.is('folder_id', null) : q.eq('folder_id', folderId);
  }
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function getDocument(id: string): Promise<StudioDocument | null> {
  const { data, error } = await supabase
    .from('studio_documents')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function createDocument(
  input: Partial<Omit<StudioDocument, 'id' | 'user_id' | 'created_at' | 'updated_at'>> & {
    title: string;
  }
): Promise<StudioDocument> {
  const { data, error } = await supabase
    .from('studio_documents')
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateDocument(
  id: string,
  input: Partial<StudioDocument>
): Promise<StudioDocument> {
  const { data, error } = await supabase
    .from('studio_documents')
    .update(input)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteDocument(id: string): Promise<void> {
  const { error } = await supabase.from('studio_documents').delete().eq('id', id);
  if (error) throw error;
}

export async function duplicateDocument(id: string): Promise<StudioDocument | null> {
  const original = await getDocument(id);
  if (!original) return null;
  const { id: _id, user_id: _uid, created_at: _c, updated_at: _u, folder_id: _f, ...rest } = original;
  const { data, error } = await supabase
    .from('studio_documents')
    .insert({ ...rest, title: `${original.title} (Copy)`, is_draft: true, status: 'draft' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function toggleDocumentFavourite(id: string, fav: boolean): Promise<void> {
  const { error } = await supabase
    .from('studio_documents')
    .update({ is_favourite: fav })
    .eq('id', id);
  if (error) throw error;
}

// ---------- Document Versions ----------
export async function getDocumentVersions(docId: string): Promise<StudioDocumentVersion[]> {
  const { data, error } = await supabase
    .from('studio_document_versions')
    .select('*')
    .eq('document_id', docId)
    .order('version_number', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function saveDocumentVersion(
  docId: string,
  title: string,
  content: string | null
): Promise<StudioDocumentVersion> {
  const existing = await getDocumentVersions(docId);
  const nextVersion = existing.length > 0 ? Math.max(...existing.map((v) => v.version_number)) + 1 : 1;
  const { data, error } = await supabase
    .from('studio_document_versions')
    .insert({
      document_id: docId,
      title,
      content,
      version_number: nextVersion,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function restoreDocumentVersion(
  docId: string,
  versionId: string
): Promise<StudioDocument | null> {
  const { data: version, error: vErr } = await supabase
    .from('studio_document_versions')
    .select('*')
    .eq('id', versionId)
    .eq('document_id', docId)
    .maybeSingle();
  if (vErr) throw vErr;
  if (!version) return null;
  return updateDocument(docId, { title: version.title, content: version.content });
}

// ---------- Images ----------
export async function getImages(folderId?: string | null): Promise<StudioImage[]> {
  let q = supabase.from('studio_images').select('*').order('created_at', { ascending: false });
  if (folderId !== undefined) {
    q = folderId === null ? q.is('folder_id', null) : q.eq('folder_id', folderId);
  }
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function getImage(id: string): Promise<StudioImage | null> {
  const { data, error } = await supabase
    .from('studio_images')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function createImage(
  input: Partial<Omit<StudioImage, 'id' | 'user_id' | 'created_at' | 'updated_at'>> & {
    title: string;
  }
): Promise<StudioImage> {
  const { data, error } = await supabase
    .from('studio_images')
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateImage(
  id: string,
  input: Partial<StudioImage>
): Promise<StudioImage> {
  const { data, error } = await supabase
    .from('studio_images')
    .update(input)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteImage(id: string): Promise<void> {
  const { data: img } = await supabase
    .from('studio_images')
    .select('storage_path')
    .eq('id', id)
    .maybeSingle();
  if (img?.storage_path) {
    await supabase.storage.from('photos').remove([img.storage_path]);
  }
  const { error } = await supabase.from('studio_images').delete().eq('id', id);
  if (error) throw error;
}

export async function toggleImageFavourite(id: string, fav: boolean): Promise<void> {
  const { error } = await supabase
    .from('studio_images')
    .update({ is_favourite: fav })
    .eq('id', id);
  if (error) throw error;
}

// ---------- Projects ----------
export async function getProjects(): Promise<StudioProject[]> {
  const { data, error } = await supabase
    .from('studio_projects')
    .select('*')
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getProject(id: string): Promise<StudioProject | null> {
  const { data, error } = await supabase
    .from('studio_projects')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function createProject(
  input: Pick<StudioProject, 'name' | 'description' | 'project_type'>
): Promise<StudioProject> {
  const { data, error } = await supabase
    .from('studio_projects')
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteProject(id: string): Promise<void> {
  const { error } = await supabase.from('studio_projects').delete().eq('id', id);
  if (error) throw error;
}

export async function toggleProjectFavourite(id: string, fav: boolean): Promise<void> {
  const { error } = await supabase
    .from('studio_projects')
    .update({ is_favourite: fav })
    .eq('id', id);
  if (error) throw error;
}

// ---------- Project Items ----------
export async function getProjectItems(projectId: string): Promise<StudioProjectItem[]> {
  const { data, error } = await supabase
    .from('studio_project_items')
    .select('*')
    .eq('project_id', projectId)
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function addProjectItem(
  projectId: string,
  itemType: string,
  documentId?: string,
  imageId?: string
): Promise<void> {
  const { error } = await supabase.from('studio_project_items').insert({
    project_id: projectId,
    item_type: itemType,
    document_id: documentId ?? null,
    image_id: imageId ?? null,
  });
  if (error) throw error;
}

export async function removeProjectItem(itemId: string): Promise<void> {
  const { error } = await supabase
    .from('studio_project_items')
    .delete()
    .eq('id', itemId);
  if (error) throw error;
}

// ---------- Templates ----------
export async function getTemplates(): Promise<StudioTemplate[]> {
  const { data, error } = await supabase
    .from('studio_templates')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

// ---------- Recent Creations ----------
export async function getRecentCreations(limit = 12) {
  const [docs, imgs] = await Promise.all([
    supabase
      .from('studio_documents')
      .select('id, title, content_type, status, updated_at, is_favourite')
      .order('updated_at', { ascending: false })
      .limit(limit),
    supabase
      .from('studio_images')
      .select('id, title, image_type, public_url, created_at, is_favourite')
      .order('created_at', { ascending: false })
      .limit(limit),
  ]);
  return {
    documents: docs.data ?? [],
    images: imgs.data ?? [],
  };
}

// ---------- Favourites ----------
export async function getFavourites() {
  const [docs, imgs, projs] = await Promise.all([
    supabase
      .from('studio_documents')
      .select('*')
      .eq('is_favourite', true)
      .order('updated_at', { ascending: false }),
    supabase
      .from('studio_images')
      .select('*')
      .eq('is_favourite', true)
      .order('created_at', { ascending: false }),
    supabase
      .from('studio_projects')
      .select('*')
      .eq('is_favourite', true)
      .order('updated_at', { ascending: false }),
  ]);
  return {
    documents: docs.data ?? [],
    images: imgs.data ?? [],
    projects: projs.data ?? [],
  };
}
