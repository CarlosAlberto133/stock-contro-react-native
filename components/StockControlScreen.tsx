import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Modal, Pressable } from 'react-native';

interface ItemEstoque {
  id: string;
  nome: string;
  valor: number;
  quantidade: number;
}

const TelaControleEstoque: React.FC = () => {
  const [totalItens, setTotalItens] = useState<number>(200);
  const [itemSelecionado, setItemSelecionado] = useState<string>('Agulhas');
  const [modalVisivel, setModalVisivel] = useState<boolean>(false);
  const [itens, setItens] = useState<ItemEstoque[]>([
    { id: '1', nome: 'Agulha e crochê', valor: 20, quantidade: 20 },
    { id: '2', nome: 'Agulha', valor: 20, quantidade: 20 },
    { id: '3', nome: 'Agulha', valor: 20, quantidade: 20 },
    { id: '4', nome: 'Agulha', valor: 20, quantidade: 20 },
    { id: '5', nome: 'Agulha', valor: 20, quantidade: 20 },
    { id: '6', nome: 'Agulha', valor: 20, quantidade: 20 },
  ]);

  const opcoesItens = ['Agulhas', 'Linha', 'Tecido'];

  const adicionarItem = () => {
    console.log('Adicionar item');
  };

  const editarItem = (id: string) => {
    console.log('Editar item', id);
  };

  const excluirItem = (id: string) => {
    console.log('Excluir item', id);
  };

  const renderizarItem = (item: ItemEstoque) => (
    <View key={item.id} style={estilos.containerItem}>
      <Text style={estilos.itemTexto}>{item.nome}</Text>
      <Text style={estilos.itemTexto}>{item.valor}</Text>
      <Text style={estilos.itemTexto}>{item.quantidade}</Text>
      <View style={estilos.acoes}>
        <TouchableOpacity onPress={() => editarItem(item.id)}>
          <Text style={estilos.acaoBotao}>~</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => excluirItem(item.id)}>
          <Text style={estilos.acaoBotao}>x</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={estilos.container}>
      <View style={estilos.containerTotal}>
        <Text style={estilos.labelTotal}>Total de itens:</Text>
        <TextInput
          style={estilos.inputTotal}
          value={totalItens.toString()}
          onChangeText={(texto: string) => setTotalItens(parseInt(texto) || 0)}
          keyboardType="numeric"
        />
      </View>
      <View style={estilos.containerSelecao}>
        <Pressable style={estilos.pickerSimulado} onPress={() => setModalVisivel(true)}>
          <Text>{itemSelecionado}</Text>
        </Pressable>
        <TouchableOpacity style={estilos.botaoAdicionar} onPress={adicionarItem}>
          <Text style={estilos.textoBotaoAdicionar}>adicionar</Text>
        </TouchableOpacity>
      </View>
      <View style={estilos.cabecalhoTabela}>
        <Text style={estilos.cabecalhoTexto}>item</Text>
        <Text style={estilos.cabecalhoTexto}>valor</Text>
        <Text style={estilos.cabecalhoTexto}>quantidade</Text>
        <Text style={estilos.cabecalhoTexto}>editar/excluir</Text>
      </View>
      <ScrollView>
        {itens.map(renderizarItem)}
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisivel}
        onRequestClose={() => setModalVisivel(false)}
      >
        <View style={estilos.centeredView}>
          <View style={estilos.modalView}>
            {opcoesItens.map((item) => (
              <Pressable
                key={item}
                style={estilos.botaoOpcao}
                onPress={() => {
                  setItemSelecionado(item);
                  setModalVisivel(false);
                }}
              >
                <Text style={estilos.textoOpcao}>{item}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const estilos = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E1E',
    padding: 16,
  },
  containerTotal: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  labelTotal: {
    color: 'white',
    fontSize: 18,
    marginRight: 8,
  },
  inputTotal: {
    backgroundColor: 'white',
    padding: 8,
    width: 80,
    fontSize: 18,
  },
  containerSelecao: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  pickerSimulado: {
    flex: 1,
    backgroundColor: 'white',
    marginRight: 8,
    padding: 10,
    justifyContent: 'center',
  },
  botaoAdicionar: {
    backgroundColor: 'white',
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoBotaoAdicionar: {
    color: 'black',
  },
  cabecalhoTabela: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cabecalhoTexto: {
    color: 'white',
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  containerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 8,
    borderRadius: 4,
  },
  itemTexto: {
    flex: 1,
    textAlign: 'center',
  },
  acoes: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flex: 1,
  },
  acaoBotao: {
    fontSize: 18,
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5
  },
  botaoOpcao: {
    padding: 10,
    marginVertical: 5,
  },
  textoOpcao: {
    fontSize: 18,
  },
});

export default TelaControleEstoque;