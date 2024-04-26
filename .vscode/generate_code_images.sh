#!/bin/bash

# Check if the input parameter is a file
if [ ! -f "$1" ]; then
  echo "Error: The argument must be a path to a Markdown file."
  exit 1
fi

# Path to the Markdown file
markdownFile="$1"

# Extract the filename without the extension to use as a subdirectory
filename=$(basename -- "$markdownFile")
dirname="${filename%.*}"

# Create an images directory if it doesn't exist, including a subdirectory for the current file
outputDir=./assets/images/code_images/$dirname
mkdir -p "$outputDir"

# Counter for file names
counter=1

# Iterate through the file and extract code blocks
while IFS= read -r line; do
  # Start of a code block
  if [[ $line == \`\`\`* ]]; then
    # Remove three backticks to detect the language
    readLanguage=${line/\`\`\`/}
    # Default to csharp if no language is specified
    language=${readLanguage:-csharp}
    echo "Generating image for code block in $language"
    # Start reading the code until another ``` is found
    codeBlock=""
    while IFS= read -r line && [[ $line != \`\`\` ]]; do
      codeBlock+="$line\n"
    done
    # Use carbon-now-cli to generate an image for the code
    echo -e "$codeBlock" > temp_code_file
    # Use awk to remove empty lines at the end of the code block
    awk '{
        if (NF > 0) {
            nonempty = NR;
        }
        lines[NR] = $0;
    }
    END {
        for (i = 1; i <= nonempty; i++)
            print lines[i];
    }' temp_code_file > temp_code_file_processed
    # Here, we use the -l option to specify the language and -h for headless mode to avoid opening the browser
    carbon-now temp_code_file_processed --save-as "$outputDir/$counter" -l "$language"
    let counter++
  fi
done < "$markdownFile"

# Remove the temporary file containing the code
rm -f temp_code_file temp_code_file_processed

echo "Code images have been generated in the directory $outputDir."
