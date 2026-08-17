import { supabase } from './supabase';

const BUCKET = 'news-images';

/**
 * Upload an image to Supabase Storage and return the public URL
 */
export async function uploadNewsImage(file) {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(fileName, file, { cacheControl: '3600', upsert: false });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(fileName);
    return data.publicUrl;
  } catch (error) {
    console.error('Failed to upload image:', error);
    return null;
  }
}

/**
 * Delete an image from Supabase Storage by its public URL
 */
export async function deleteNewsImage(publicUrl) {
  try {
    if (!publicUrl) return;
    const parts = publicUrl.split(`/storage/v1/object/public/${BUCKET}/`);
    if (parts.length < 2) return;
    const filePath = parts[1];

    const { error } = await supabase.storage.from(BUCKET).remove([filePath]);
    if (error) throw error;
  } catch (error) {
    console.error('Failed to delete image:', error);
  }
}

/**
 * Fetch all published news (for users)
 */
export async function getPublishedNews() {
  try {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Failed to fetch published news:', error);
    return [];
  }
}

/**
 * Fetch all news (for admins)
 */
export async function getAllNews() {
  try {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Failed to fetch all news:', error);
    return [];
  }
}

/**
 * Create new announcement (with optional image)
 */
export async function createNews(title, content, isPublished = true, imageFile = null) {
  try {
    let image_url = null;
    if (imageFile) {
      image_url = await uploadNewsImage(imageFile);
    }

    const { error } = await supabase
      .from('announcements')
      .insert({
        title,
        content,
        is_published: isPublished,
        image_url
      });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Failed to create news:', error);
    return false;
  }
}

/**
 * Update announcement
 */
export async function updateNews(id, updates, imageFile = null, oldImageUrl = null) {
  try {
    // If a new image is being uploaded, upload it and remove the old one
    if (imageFile) {
      const newUrl = await uploadNewsImage(imageFile);
      if (newUrl) {
        updates.image_url = newUrl;
        // Delete old image if it exists
        if (oldImageUrl) {
          await deleteNewsImage(oldImageUrl);
        }
      }
    }

    const { error } = await supabase
      .from('announcements')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Failed to update news:', error);
    return false;
  }
}

/**
 * Delete announcement (and its image)
 */
export async function deleteNews(id, imageUrl = null) {
  try {
    // Clean up image from storage
    if (imageUrl) {
      await deleteNewsImage(imageUrl);
    }

    const { error } = await supabase
      .from('announcements')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Failed to delete news:', error);
    return false;
  }
}
