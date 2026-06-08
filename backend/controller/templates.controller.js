import { JSDOM } from "jsdom";
import mammoth from "mammoth";
import Template from "../models/Template.js";

const getTemplateOwnerId = (req) => req.lawyer?._id || req.user?._id;

const extractPlaceholders = (contentHtml) => {
  const matches = String(contentHtml || "").match(/{{\s*[A-Z0-9_]+\s*}}/g) || [];
  return [...new Set(matches.map((item) => item.replace(/\s+/g, "")))];
};

const sanitizeHtmlInput = (value) => String(value || "").trim();

const appendInlineStyle = (element, declarations) => {
  if (!element || !declarations) {
    return;
  }

  const currentStyle = String(element.getAttribute("style") || "").trim();
  const nextStyle = currentStyle
    ? `${currentStyle.replace(/;?\s*$/, ";")} ${declarations}`
    : declarations;

  element.setAttribute("style", nextStyle.trim());
};

const sanitizeAnchorHref = (href) => {
  const normalizedHref = String(href || "").trim();

  if (!normalizedHref) {
    return "";
  }

  if (/^(javascript|vbscript|data):/i.test(normalizedHref)) {
    return "";
  }

  return normalizedHref;
};

const formatConversionWarnings = (messages = []) =>
  messages
    .map((item) => {
      const type = String(item?.type || "warning").trim();
      const message = String(item?.message || "").trim();

      return message ? `${type}: ${message}` : "";
    })
    .filter(Boolean);

const postProcessConvertedHtml = (rawHtml, paragraphAlignments = []) => {
  const html = sanitizeHtmlInput(rawHtml);

  if (!html) {
    return "";
  }

  const dom = new JSDOM(`<body>${html}</body>`);
  const { document } = dom.window;

  document
    .querySelectorAll("script, style, iframe, object, embed, meta, link")
    .forEach((node) => node.remove());

  document.querySelectorAll("*").forEach((element) => {
    [...element.attributes].forEach((attribute) => {
      if (/^on/i.test(attribute.name)) {
        element.removeAttribute(attribute.name);
      }
    });
  });

  document.querySelectorAll("a").forEach((anchor) => {
    const safeHref = sanitizeAnchorHref(anchor.getAttribute("href"));

    if (safeHref) {
      anchor.setAttribute("href", safeHref);
      anchor.setAttribute("target", "_blank");
      anchor.setAttribute("rel", "noopener noreferrer");
    } else {
      anchor.removeAttribute("href");
    }

    appendInlineStyle(
      anchor,
      "color: #1d4ed8; text-decoration: underline; word-break: break-word;",
    );
  });

  document.querySelectorAll("p").forEach((paragraph) => {
    const textContent = paragraph.textContent.replace(/\u00a0/g, " ").trim();

    if (!textContent && !paragraph.querySelector("img, br, table, ul, ol")) {
      paragraph.innerHTML = "&nbsp;";
    }

    appendInlineStyle(paragraph, "margin: 0 0 1rem; line-height: 1.7;");
  });

  document.querySelectorAll("h1").forEach((heading) => {
    appendInlineStyle(
      heading,
      "margin: 0 0 1.25rem; font-size: 1.9rem; line-height: 1.25; font-weight: 700;",
    );
  });

  document.querySelectorAll("h2").forEach((heading) => {
    appendInlineStyle(
      heading,
      "margin: 1.75rem 0 1rem; font-size: 1.45rem; line-height: 1.3; font-weight: 700;",
    );
  });

  document.querySelectorAll("h3, h4, h5, h6").forEach((heading) => {
    appendInlineStyle(
      heading,
      "margin: 1.5rem 0 0.85rem; font-size: 1.15rem; line-height: 1.35; font-weight: 700;",
    );
  });

  document.querySelectorAll("ul, ol").forEach((list) => {
    appendInlineStyle(list, "margin: 0 0 1rem; padding-left: 1.5rem;");
  });

  document.querySelectorAll("li").forEach((listItem) => {
    appendInlineStyle(listItem, "margin-bottom: 0.35rem; line-height: 1.7;");
  });

  document.querySelectorAll("blockquote").forEach((quote) => {
    appendInlineStyle(
      quote,
      "margin: 1.25rem 0; padding-left: 1rem; border-left: 4px solid #cbd5e1; color: #334155;",
    );
  });

  document.querySelectorAll("img").forEach((image) => {
    appendInlineStyle(
      image,
      "display: block; max-width: 100%; height: auto; margin: 1rem auto;",
    );
  });

  document.querySelectorAll("table").forEach((table) => {
    appendInlineStyle(
      table,
      "width: 100%; border-collapse: collapse; margin: 1.5rem 0; table-layout: auto;",
    );
  });

  document.querySelectorAll("th").forEach((headerCell) => {
    appendInlineStyle(
      headerCell,
      "border: 1px solid #cbd5e1; padding: 0.75rem; background: #f8fafc; text-align: left; vertical-align: top;",
    );
  });

  document.querySelectorAll("td").forEach((cell) => {
    appendInlineStyle(
      cell,
      "border: 1px solid #cbd5e1; padding: 0.75rem; vertical-align: top;",
    );
  });

  document.querySelectorAll("span").forEach((span) => {
    if (!span.attributes.length && !span.className) {
      span.replaceWith(...span.childNodes);
    }
  });

  if (paragraphAlignments.length) {
    const blockElements = [
      ...document.querySelectorAll("p, h1, h2, h3, h4, h5, h6, li"),
    ];
    blockElements.forEach((element, index) => {
      const alignment = paragraphAlignments[index];
      if (alignment && alignment !== "left") {
        const textAlign = alignment === "both" ? "justify" : alignment;
        appendInlineStyle(element, `text-align: ${textAlign};`);
      }
    });
  }

  const wrapper = document.createElement("div");
  wrapper.setAttribute("class", "template-word-content");
  wrapper.setAttribute(
    "style",
    "font-family: 'Times New Roman', Georgia, serif; font-size: 12pt; color: #111827; line-height: 1.7;",
  );

  while (document.body.firstChild) {
    wrapper.appendChild(document.body.firstChild);
  }

  return wrapper.outerHTML;
};

const isDocxUpload = (file) => {
  const fileName = String(file?.originalname || "").toLowerCase();
  const mimeType = String(file?.mimetype || "").toLowerCase();

  return (
    fileName.endsWith(".docx") ||
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  );
};

export const getTemplates = async (req, res) => {
  try {
    const ownerId = getTemplateOwnerId(req);
    const templates = await Template.find({ user: ownerId }).sort({
      updatedAt: -1,
      createdAt: -1,
    });

    return res.json(templates);
  } catch (error) {
    console.error("getTemplates error:", error);
    return res.status(500).json({ message: "Sablonlar alinamadi." });
  }
};

export const getTemplateById = async (req, res) => {
  try {
    const ownerId = getTemplateOwnerId(req);
    const template = await Template.findOne({
      _id: req.params.id,
      user: ownerId,
    });

    if (!template) {
      return res.status(404).json({ message: "Sablon bulunamadi." });
    }

    return res.json(template);
  } catch (error) {
    console.error("getTemplateById error:", error);
    return res.status(500).json({ message: "Sablon alinamadi." });
  }
};

export const createTemplate = async (req, res) => {
  try {
    const ownerId = getTemplateOwnerId(req);
    const title = String(req.body.title || "").trim();
    const description = String(req.body.description || "").trim();
    const contentHtml = sanitizeHtmlInput(req.body.contentHtml);
    const sourceType = req.body.sourceType === "word" ? "word" : "editor";

    if (!title || !contentHtml) {
      return res.status(400).json({
        message: "Baslik ve sablon icerigi zorunludur.",
      });
    }

    const template = await Template.create({
      user: ownerId,
      title,
      description,
      contentHtml,
      sourceType,
      placeholders: extractPlaceholders(contentHtml),
    });

    return res.status(201).json(template);
  } catch (error) {
    console.error("createTemplate error:", error);
    return res.status(500).json({ message: "Sablon kaydedilemedi." });
  }
};

export const updateTemplate = async (req, res) => {
  try {
    const ownerId = getTemplateOwnerId(req);
    const title = String(req.body.title || "").trim();
    const description = String(req.body.description || "").trim();
    const contentHtml = sanitizeHtmlInput(req.body.contentHtml);
    const sourceType = req.body.sourceType === "word" ? "word" : "editor";

    if (!title || !contentHtml) {
      return res.status(400).json({
        message: "Baslik ve sablon icerigi zorunludur.",
      });
    }

    const template = await Template.findOneAndUpdate(
      { _id: req.params.id, user: ownerId },
      {
        title,
        description,
        contentHtml,
        sourceType,
        placeholders: extractPlaceholders(contentHtml),
      },
      { new: true },
    );

    if (!template) {
      return res.status(404).json({ message: "Sablon bulunamadi." });
    }

    return res.json(template);
  } catch (error) {
    console.error("updateTemplate error:", error);
    return res.status(500).json({ message: "Sablon guncellenemedi." });
  }
};

export const deleteTemplate = async (req, res) => {
  try {
    const ownerId = getTemplateOwnerId(req);
    const template = await Template.findOneAndDelete({
      _id: req.params.id,
      user: ownerId,
    });

    if (!template) {
      return res.status(404).json({ message: "Sablon bulunamadi." });
    }

    return res.json({ message: "Sablon silindi." });
  } catch (error) {
    console.error("deleteTemplate error:", error);
    return res.status(500).json({ message: "Sablon silinemedi." });
  }
};

export const convertWordToTemplateHtml = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Word dosyasi gerekli." });
    }

    if (!isDocxUpload(req.file)) {
      return res.status(400).json({
        message: "Su an sadece .docx uzantili Word dosyalari destekleniyor.",
      });
    }

    const paragraphAlignments = [];

    const result = await mammoth.convertToHtml(
      { buffer: req.file.buffer },
      {
        styleMap: [
          "p[style-name='Title'] => h1:fresh",
          "p[style-name='Subtitle'] => h2:fresh",
          "p[style-name='Heading 1'] => h2:fresh",
          "p[style-name='Heading 2'] => h3:fresh",
          "p[style-name='Heading 3'] => h4:fresh",
          "p[style-name='Heading 4'] => h5:fresh",
          "p[style-name='Quote'] => blockquote > p:fresh",
          "p[style-name='Intense Quote'] => blockquote > p:fresh",
          "u => span[style='text-decoration:underline']",
        ],
        ignoreEmptyParagraphs: false,
        convertImage: mammoth.images.dataUri,
        transformDocument: mammoth.transforms.paragraph(function (paragraph) {
          paragraphAlignments.push(paragraph.alignment || null);
          return paragraph;
        }),
      },
    );

    const contentHtml = postProcessConvertedHtml(result.value, paragraphAlignments);

    if (!contentHtml) {
      return res.status(400).json({
        message: "Word dosyasindan kullanilabilir bir sablon cikmadi.",
      });
    }

    return res.json({
      contentHtml,
      placeholders: extractPlaceholders(contentHtml),
      warnings: formatConversionWarnings(result.messages),
    });
  } catch (error) {
    console.error("convertWordToTemplateHtml error:", error);
    return res.status(500).json({
      message: "Word dosyasi HTML sablona cevrilemedi.",
    });
  }
};
