Place course card images here.

Examples:
- /public/courses/apim.png  (refer as "/courses/apim.png")
- /public/courses/cpi.png   (refer as "/courses/cpi.png")

In your course data, set the image field to the app-relative path, for example:
  image: "/courses/apim.png"

The CourseThumbnail component also falls back to the existing `thumbnail` field if `image` is not provided.