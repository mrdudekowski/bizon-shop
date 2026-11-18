"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { ArticleBodyBlock, ArticleBodyDocument } from "@/admin/domain/articleBody";
import { browserAdminClient } from "@/admin/client/localStore";
import { resolveMediaPreviewUrl } from "@/admin/domain/catalogPreviewUrl";
import { MediaPicker } from "@/admin/media/MediaPicker";

import styles from "./ArticleBodyEditor.module.css";

export function ArticleBodyEditor({
  value,
  onChange,
  disabled = false,
}: {
  value: ArticleBodyDocument;
  onChange: (next: ArticleBodyDocument) => void;
  disabled?: boolean;
}) {
  const [mediaById, setMediaById] = useState<Record<string, string>>({});

  useEffect(() => {
    let active = true;
    void browserAdminClient().listAssets().then((assets) => {
      if (!active) return;
      setMediaById(Object.fromEntries(assets.map((asset) => [asset.id, asset.dataUrl])));
    }).catch(() => {});
    return () => { active = false; };
  }, []);

  function replaceBlock(index: number, block: ArticleBodyBlock) {
    onChange({ ...value, blocks: value.blocks.map((current, currentIndex) => currentIndex === index ? block : current) });
  }

  function appendBlock(block: ArticleBodyBlock) {
    onChange({ ...value, blocks: [...value.blocks, block] });
  }

  function moveBlock(index: number, delta: -1 | 1) {
    const nextIndex = index + delta;
    if (nextIndex < 0 || nextIndex >= value.blocks.length) return;
    const blocks = [...value.blocks];
    [blocks[index], blocks[nextIndex]] = [blocks[nextIndex], blocks[index]];
    onChange({ ...value, blocks });
  }

  function removeBlock(index: number) {
    onChange({ ...value, blocks: value.blocks.filter((_, currentIndex) => currentIndex !== index) });
  }

  return (
    <fieldset className={styles.editor} disabled={disabled}>
      <legend>Текст и иллюстрации статьи</legend>
      {value.blocks.length === 0 ? <p className={styles.empty}>Добавьте абзац, заголовок, список или изображение.</p> : null}
      <ol className={styles.blocks} aria-label="Блоки статьи">
        {value.blocks.map((block, index) => (
          <li className={styles.block} key={`${block.type}-${index}`}>
            <div className={styles.blockHeader}>
              <strong>{block.type === "paragraph" ? "Абзац" : block.type === "heading" ? "Заголовок" : block.type === "list" ? (block.ordered ? "Нумерованный список" : "Маркированный список") : "Изображение"}</strong>
              <div className={styles.blockActions}>
                <button type="button" aria-label={`Переместить блок ${index + 1} вверх`} disabled={index === 0} onClick={() => moveBlock(index, -1)}>↑</button>
                <button type="button" aria-label={`Переместить блок ${index + 1} вниз`} disabled={index === value.blocks.length - 1} onClick={() => moveBlock(index, 1)}>↓</button>
                <button type="button" aria-label={`Удалить блок ${index + 1}`} onClick={() => removeBlock(index)}>Удалить</button>
              </div>
            </div>
            {block.type === "paragraph" ? (
              <label className={styles.field}>Текст абзаца<textarea value={block.text} onChange={(event) => replaceBlock(index, { ...block, text: event.target.value })} /></label>
            ) : null}
            {block.type === "heading" ? (
              <div className={styles.fields}>
                <label className={styles.field}>Уровень заголовка
                  <select value={block.level} onChange={(event) => replaceBlock(index, { ...block, level: event.target.value === "3" ? 3 : 2 })}>
                    <option value="2">Раздел</option><option value="3">Подраздел</option>
                  </select>
                </label>
                <label className={styles.field}>Текст заголовка<textarea value={block.text} onChange={(event) => replaceBlock(index, { ...block, text: event.target.value })} /></label>
              </div>
            ) : null}
            {block.type === "list" ? (
              <div className={styles.fields}>
                <label className={styles.field}>Вид списка
                  <select value={block.ordered ? "ordered" : "unordered"} onChange={(event) => replaceBlock(index, { ...block, ordered: event.target.value === "ordered" })}>
                    <option value="unordered">Маркированный</option><option value="ordered">Нумерованный</option>
                  </select>
                </label>
                <label className={styles.field}>Элементы списка — по одному на строку<textarea value={block.items.join("\n")} onChange={(event) => replaceBlock(index, { ...block, items: event.target.value.split(/\r?\n/) })} /></label>
              </div>
            ) : null}
            {block.type === "image" ? (
              <div className={styles.imageBlock}>
                {block.assetId && resolveMediaPreviewUrl(mediaById[block.assetId]) ? (
                  <Image className={styles.imagePreview} src={resolveMediaPreviewUrl(mediaById[block.assetId])!} alt="" width={1200} height={800} unoptimized />
                ) : <p className={styles.empty}>Изображение не выбрано или отсутствует в медиатеке.</p>}
                <MediaPicker
                  disabled={disabled}
                  pickerTitle="Изображение для статьи"
                  itemLabel="изображение статьи"
                  onSelect={(asset) => {
                    setMediaById((current) => ({ ...current, [asset.id]: asset.dataUrl }));
                    replaceBlock(index, { ...block, assetId: asset.id });
                  }}
                />
                <label className={styles.field}>Alt-текст<input value={block.alt} onChange={(event) => replaceBlock(index, { ...block, alt: event.target.value })} /></label>
                <label className={styles.field}>Подпись<textarea value={block.caption} onChange={(event) => replaceBlock(index, { ...block, caption: event.target.value })} /></label>
              </div>
            ) : null}
          </li>
        ))}
      </ol>
      <div className={styles.addActions} aria-label="Добавить блок статьи">
        <button type="button" onClick={() => appendBlock({ type: "paragraph", text: "" })}>Добавить абзац</button>
        <button type="button" onClick={() => appendBlock({ type: "heading", level: 2, text: "" })}>Добавить заголовок</button>
        <button type="button" onClick={() => appendBlock({ type: "list", ordered: false, items: [""] })}>Добавить список</button>
        <button type="button" onClick={() => appendBlock({ type: "image", assetId: null, alt: "", caption: "" })}>Добавить изображение</button>
      </div>
    </fieldset>
  );
}
