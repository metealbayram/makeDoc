import Document from '../models/Document.js';

const getUserDocumentRole = (document, userId) => {
  if (!document || !userId) return null;

  if (document.user.toString() === userId.toString()) {
    return 'owner';
  }

  const sharedUser = document.sharedWith.find(
    (item) => item.user.toString() === userId.toString()
  );

  return sharedUser ? sharedUser.role : null;
};

export const canViewDocument = async (req, res, next) => {
  try {
    const document = await Document.findById(req.params.id)
      .populate('user', 'name email')
      .populate('sharedWith.user', 'name email');

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document bulunamadı'
      });
    }

    const role = getUserDocumentRole(document, req.user.id);

    if (!role) {
      return res.status(403).json({
        success: false,
        message: 'Bu documenti görüntüleme yetkiniz yok'
      });
    }

    req.document = document;
    req.documentRole = role;
    next();
  } catch (error) {
    console.error('canViewDocument error:', error);
    return res.status(500).json({
      success: false,
      message: 'Yetki kontrolü sırasında hata oluştu'
    });
  }
};

export const canEditDocument = async (req, res, next) => {
  try {
    const document = await Document.findById(req.params.id)
      .populate('user', 'name email')
      .populate('sharedWith.user', 'name email');

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document bulunamadı'
      });
    }

    const role = getUserDocumentRole(document, req.user.id);

    if (role !== 'owner' && role !== 'editor') {
      return res.status(403).json({
        success: false,
        message: 'Bu documenti düzenleme yetkiniz yok'
      });
    }

    req.document = document;
    req.documentRole = role;
    next();
  } catch (error) {
    console.error('canEditDocument error:', error);
    return res.status(500).json({
      success: false,
      message: 'Yetki kontrolü sırasında hata oluştu'
    });
  }
};

export const canDeleteDocument = async (req, res, next) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document bulunamadı'
      });
    }

    if (document.user.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Sadece document sahibi silebilir'
      });
    }

    req.document = document;
    req.documentRole = 'owner';
    next();
  } catch (error) {
    console.error('canDeleteDocument error:', error);
    return res.status(500).json({
      success: false,
      message: 'Yetki kontrolü sırasında hata oluştu'
    });
  }
};

export const canShareDocument = async (req, res, next) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document bulunamadı'
      });
    }

    if (document.user.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Sadece document sahibi paylaşım yapabilir'
      });
    }

    req.document = document;
    req.documentRole = 'owner';
    next();
  } catch (error) {
    console.error('canShareDocument error:', error);
    return res.status(500).json({
      success: false,
      message: 'Yetki kontrolü sırasında hata oluştu'
    });
  }
};