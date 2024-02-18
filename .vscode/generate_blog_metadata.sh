#!/bin/bash

if [ "$#" -ne 1 ]; then
    echo "Usage: $0 <path_to_markdown_file>"
    exit 1
fi

API_KEY=$OPENAI_API_KEY
FILE_PATH=$1

BLOG_CONTENT=$(sed -n '/---/,/---/!p' "$FILE_PATH")

PROMPT="Given the blog post content below, generate a concise SEO description (max 145 chars), a list of SEO keywords (max 15), tags (max 4, use from [csharp, dotnet, unit tests, architecture, AZURE, meetup, codecon, speaking, asp.net core, multi-tenant, caching, news, tools, or use the name of the library if this post is about it]) suitable for the post, and a short LinkedIn post text for sharing the blog post (you can use emoji, always add placeholder for link to blogpost). Please return the output in JSON format, with fields for 'seo_description', 'keywords', 'tags', and 'linkedin_post'.

Blog Post Content:
$BLOG_CONTENT"

JSON_DATA=$(jq -n \
                  --arg content "$PROMPT" \
                  '{model: "gpt-4", messages: [{role: "user", content: $content}]}' )

echo -e "Asking \e[33mOpenAI\e[0m for metadata for \e[94m$FILE_PATH\e[0m ..."

API_RESPONSE=$(curl -s -X POST "https://api.openai.com/v1/chat/completions" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $API_KEY" \
    --data "$JSON_DATA" -w "\nHTTP_STATUS_CODE:%{http_code}")

HTTP_STATUS=$(echo "$API_RESPONSE" | grep 'HTTP_STATUS_CODE:' | sed 's/HTTP_STATUS_CODE://')

if [ "$HTTP_STATUS" != "200" ]; then
    echo "Error: HTTP status $HTTP_STATUS"
    echo "Response: $API_RESPONSE"
    exit 1
else
    clear
    GENERATED_CONTENT=$(echo "$API_RESPONSE" | jq -r '.choices[0].message.content')
fi

SEO_DESCRIPTION=$(echo "$GENERATED_CONTENT" | jq -r '.seo_description')
KEYWORDS=$(echo "$GENERATED_CONTENT" | jq -r '.keywords | map("- " + .) | join("\n")')
TAGS="[$(echo "$GENERATED_CONTENT" | jq -r '.tags | join(", ")')]"
LINKEDIN_POST=$(echo "$GENERATED_CONTENT" | jq -r '.linkedin_post')
clear

echo -e "\e[33m----------------------------------------\e[0m"
echo -e "\e[33mSEO Description:\e[0m \e[97m$SEO_DESCRIPTION\e[0m"
echo -e "\e[33mKeywords:\e[0m"
echo "$KEYWORDS"
echo -e "\e[33mTags:\e[0m \e[97m$TAGS\e[0m"
echo -e "\e[33mLinkedIn Post:\e[0m \e[97m$LINKEDIN_POST\e[0m"
echo -e "\e[33m----------------------------------------\e[0m"
echo -e "\e[32mDo you want to apply the following metadata to \e[94m$FILE_PATH\e[0m?\e[0m"
read -p $'\e[32mApply metadata? (y/n): \e[0m' -n 1 -r
echo

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Metadata not applied."
    exit 0
fi

sed -i "/^description: /c\description: \"$SEO_DESCRIPTION\"" "$FILE_PATH"
sed -i "/^tags:/c\tags: $TAGS" "$FILE_PATH"
sed -i "/^linkedin_post_text: /c\linkedin_post_text: \"$LINKEDIN_POST\"" "$FILE_PATH"

awk -v keywords="$KEYWORDS" '
BEGIN {printKeywords=0}
/^keywords:/,/^---$/ {if (/^keywords:/) {print; print keywords; printKeywords=1; next} else if (/^---$/ && printKeywords) {printKeywords=0}}
!printKeywords {print}
' "$FILE_PATH" > temp_file && mv temp_file "$FILE_PATH"
