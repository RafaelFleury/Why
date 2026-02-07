import React from "react";
import { View, TextInput, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
}

export default function SearchBar({
  value,
  onChangeText,
  placeholder,
}: SearchBarProps) {
  return (
    <View
      className="flex-row items-center rounded-full mx-4 px-4 py-2.5"
      style={{ backgroundColor: "#202327" }}
    >
      <Ionicons name="search-outline" size={18} color="#536471" />
      <TextInput
        className="flex-1 ml-3 text-text-primary text-[15px]"
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#536471"
        autoCorrect={false}
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={() => onChangeText("")}>
          <Ionicons name="close-circle" size={18} color="#1d9bf0" />
        </TouchableOpacity>
      )}
    </View>
  );
}
