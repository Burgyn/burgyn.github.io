#!/bin/bash

# Assuming the draft to move is passed as the first argument
file_path="$1"
draft_file="${file_path##*/}"

echo "$draft_file"

# Prompt for the date
echo "Enter the date (format YYYY-MM-DD):"
read date

# Format the date as required
formatted_date="${date} 18:00:00.000000000 +01:00"

# Define the draft and posts directories
drafts_dir="_drafts"
posts_dir="_posts" # Adjust according to your structure

# Construct the new file name based on the date and original file name
extension="${draft_file##*.}"
new_filename="${date}-${draft_file}"

echo "New filename: $new_filename"

# Move the draft to the posts directory and rename it
mv "$drafts_dir/$draft_file" "$posts_dir/$new_filename"

# Insert the date into the file's front matter
sed -i "s/date:/date: $formatted_date/" "$posts_dir/$new_filename"

# Validation checks
# Check if 'keywords' contains values
if ! grep -A1 "keywords:" "$posts_dir/$new_filename" | grep -qP "^\s*-\s+.+"; then
    echo "Warning: keywords are missing or empty."
fi

# Check if 'description' contains text
if ! grep -qP "description:\s*.+\S" "$posts_dir/$new_filename"; then
    echo "Warning: description is missing or empty."
fi

# Check if 'tags' contains values
if ! grep -qP "tags:\s*\[\s*.+\s*\]" "$posts_dir/$new_filename"; then
    echo "Warning: tags are missing or empty."
fi

echo "Draft moved to posts, date added, and file validated: $new_filename"

# Construct the URL based on the provided base address and URL format
base_address="blog.burgyn.online"
year=$(echo $date | cut -d'-' -f1)
month=$(echo $date | cut -d'-' -f2)
day=$(echo $date | cut -d'-' -f3)
url="http://$base_address/$year/$month/$day/${title// /-}"

echo "Your post will be located at: $url"

# Open the file with the system's default text editor
code "$posts_dir/$new_filename"
