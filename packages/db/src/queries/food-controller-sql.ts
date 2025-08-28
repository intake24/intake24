export const getAllChildCategories = `
  WITH RECURSIVE children(id) AS (
    SELECT id FROM categories WHERE code = :code
    UNION ALL
    SELECT cc.sub_category_id FROM categories_categories AS cc
    JOIN children ON children.id = cc.category_id
  ) SELECT id FROM children;`;

export const getAllParentCategories = `\
  WITH RECURSIVE parents AS (\
    SELECT cc.category_id FROM categories_categories as cc \
      WHERE cc.sub_category_id IN (:sub_category_id) \
    UNION
      SELECT ccs.category_id FROM categories_categories as ccs \
      INNER JOIN parents p ON p.category_id = ccs.sub_category_id \
  ) SELECT parents.category_id, categories.code FROM parents \
   INNER join categories on parents.category_id = categories.id;`;
