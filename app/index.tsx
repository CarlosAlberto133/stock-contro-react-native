import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Modal, Pressable, Alert } from 'react-native';
import { supabase } from '../services/supabaseClient';
import Icon from 'react-native-vector-icons/FontAwesome';

interface ItemEstoque {
  id: string;
  produtos: string;
  valor: number;
  quantidade: number;
}

interface Venda {
  produto: string;
  valor: number;
  quantidadeVendida: number;
}

const TelaControleEstoque: React.FC = () => {
  const [totalItens, setTotalItens] = useState<number>(0);
  const [itemSelecionado, setItemSelecionado] = useState<string>('Todos');
  const [modalVisivel, setModalVisivel] = useState<boolean>(false);
  const [itens, setItens] = useState<ItemEstoque[]>([]);
  const [modalAdicionarVisivel, setModalAdicionarVisivel] = useState<boolean>(false);
  const [novoProduto, setNovoProduto] = useState<string>('');
  const [novoValor, setNovoValor] = useState<string>('');
  const [novaQuantidade, setNovaQuantidade] = useState<string>('');
  const [modalExcluirVisivel, setModalExcluirVisivel] = useState<boolean>(false);
  const [itemParaExcluir, setItemParaExcluir] = useState<string | null>(null);
  const [modalEditarVisivel, setModalEditarVisivel] = useState<boolean>(false);
  const [itemParaEditar, setItemParaEditar] = useState<ItemEstoque | null>(null);
  const [modalVendasVisivel, setModalVendasVisivel] = useState<boolean>(false);
  const [vendasDoDia, setVendasDoDia] = useState<Venda[]>([]);
  const [modalVendasTotaisVisivel, setModalVendasTotaisVisivel] = useState(false);
  const [diasComVendas, setDiasComVendas] = useState<any[]>([]);
  const [vendasDoDiaSelecionado, setVendasDoDiaSelecionado] = useState<Venda[]>([]);
  const [modalDetalhesDiaVisivel, setModalDetalhesDiaVisivel] = useState(false);
  const [vendasDiaSelecionado, setVendasDiaSelecionado] = useState<Venda[]>([]);
  const [dataSelecionada, setDataSelecionada] = useState('');

  const opcoesItens = ['Todos', 'Agulha', 'Linha', 'Tesoura'];

  useEffect(() => {
    buscarItens();
  }, []);

  const buscarItens = async () => {
    try {
      let { data, error } = await supabase
        .from('Stock')
        .select('*');
      
      if (error) throw error;
      
      if (data) {
        setItens(data);
        setTotalItens(data.length);
      }
    } catch (error) {
      console.error('Erro ao buscar itens:', error);
    }
  };

  const registrarVenda = async (item: ItemEstoque) => {
    const quantidadeVendida = 1; // Sempre vendendo 1 unidade por exemplo
    if (item.quantidade <= 0) {
      Alert.alert('Erro', 'Quantidade insuficiente em estoque.');
      return;
    }

    try {
      // Atualiza o estoque
      const novaQuantidade = item.quantidade - quantidadeVendida;
      const { error } = await supabase
        .from('Stock')
        .update({ quantidade: novaQuantidade })
        .eq('id', item.id);

      if (error) throw error;

      // Adiciona a venda ao histórico do dia
      setVendasDoDia((prevVendas) => {
        const vendaExistente = prevVendas.find(
          (venda) => venda.produto === item.produtos
        );

        if (vendaExistente) {
          return prevVendas.map((venda) =>
            venda.produto === item.produtos
              ? { ...venda, quantidadeVendida: venda.quantidadeVendida + 1 }
              : venda
          );
        } else {
          return [
            ...prevVendas,
            { produto: item.produtos, valor: item.valor, quantidadeVendida: 1 },
          ];
        }
      });

      Alert.alert('Sucesso', `Venda registrada: ${item.produtos}`);
      buscarItens();
    } catch (error) {
      console.error('Erro ao registrar venda:', error);
      Alert.alert('Erro', 'Não foi possível registrar a venda.');
    }
  };

  const abrirModalVendas = () => {
    setModalVendasVisivel(true);
  };

  const fecharModalVendas = () => {
    setModalVendasVisivel(false);
  };

  const salvarDia = async () => {
    if (vendasDoDia.length === 0) {
      Alert.alert('Aviso', 'Não há vendas para salvar.');
      return;
    }
  
    try {
      // Enviar vendas para a tabela do banco de dados
      const { error } = await supabase.from('DailySales').insert(vendasDoDia);
  
      if (error) throw error;
  
      // Limpar os dados das vendas do dia
      setVendasDoDia([]);
      Alert.alert('Sucesso', 'Vendas do dia salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar vendas do dia:', error);
      Alert.alert('Erro', 'Não foi possível salvar as vendas do dia.');
    }
  };

  const abrirModalVendasTotais = async () => {
    try {
      const { data, error } = await supabase
        .from('DailySales')
        .select('produto, valor, quantidadeVendida, created_at');
  
      if (error) throw error;
  
      // Agrupar vendas por dia
      const agrupadoPorDia = data.reduce((acumulador: any, venda: any) => {
        const dia = new Date(venda.created_at).toLocaleDateString();
        if (!acumulador[dia]) {
          acumulador[dia] = { data: dia, vendas: [], quantidadeTotal: 0 };
        }
        acumulador[dia].vendas.push(venda);
        acumulador[dia].quantidadeTotal += venda.quantidadeVendida;
        return acumulador;
      }, {});
  
      setDiasComVendas(Object.values(agrupadoPorDia));
      setModalVendasTotaisVisivel(true);
    } catch (error) {
      console.error('Erro ao buscar vendas totais:', error);
      Alert.alert('Erro', 'Não foi possível carregar as vendas totais.');
    }
  };
  
  const fecharModalVendasTotais = () => {
    setModalVendasTotaisVisivel(false);
    setVendasDoDiaSelecionado([]);
  };
  
  const selecionarDia = (dia: string) => {
    const vendas = diasComVendas.find((d) => d.data === dia)?.vendas || [];
    setVendasDiaSelecionado(vendas);
    setDataSelecionada(dia);
    setModalVendasTotaisVisivel(false);
    setModalDetalhesDiaVisivel(true);
  };

  const fecharModalDetalhesDia = () => {
    setModalDetalhesDiaVisivel(false);
    setVendasDiaSelecionado([]);
    setDataSelecionada('');
  };

  // Adicione um estado para o texto de pesquisa
  const [searchText, setSearchText] = useState('');

  // Modifique a função de renderização dos itens para incluir filtragem
  const itensFiltrados = itens.filter(item =>
  item.produtos.toLowerCase().includes(searchText.toLowerCase())
  );

  const adicionarItem = () => {
    setModalAdicionarVisivel(true);
  };

  const salvarNovoItem = async () => {
    if (!novoProduto || !novoValor || !novaQuantidade) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos.');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('Stock')
        .insert([
          { produtos: novoProduto, valor: parseFloat(novoValor), quantidade: parseInt(novaQuantidade) }
        ]);

      if (error) throw error;

      Alert.alert('Sucesso', 'Item adicionado com sucesso!');
      setModalAdicionarVisivel(false);
      limparCamposNovoItem();
      buscarItens();
    } catch (error) {
      console.error('Erro ao adicionar item:', error);
      Alert.alert('Erro', 'Não foi possível adicionar o item.');
    }
  };

  const limparCamposNovoItem = () => {
    setNovoProduto('');
    setNovoValor('');
    setNovaQuantidade('');
  };

  const editarItem = (item: ItemEstoque) => {
    setItemParaEditar(item);
    setModalEditarVisivel(true);
  };

  const salvarEdicaoItem = async () => {
    if (!itemParaEditar) return;

    try {
      const { error } = await supabase
        .from('Stock')
        .update({
          produtos: itemParaEditar.produtos,
          valor: itemParaEditar.valor,
          quantidade: itemParaEditar.quantidade
        })
        .eq('id', itemParaEditar.id);

      if (error) throw error;

      Alert.alert('Sucesso', 'Item atualizado com sucesso!');
      setModalEditarVisivel(false);
      setItemParaEditar(null);
      buscarItens();
    } catch (error) {
      console.error('Erro ao atualizar item:', error);
      Alert.alert('Erro', 'Não foi possível atualizar o item.');
    }
  };

  const excluirItem = (id: string) => {
    setItemParaExcluir(id);
    setModalExcluirVisivel(true);
  };

  const confirmarExclusao = async () => {
    if (!itemParaExcluir) return;

    try {
      const { error } = await supabase
        .from('Stock')
        .delete()
        .eq('id', itemParaExcluir);

      if (error) throw error;

      Alert.alert('Sucesso', 'Item excluído com sucesso!');
      setModalExcluirVisivel(false);
      setItemParaExcluir(null);
      buscarItens();
    } catch (error) {
      console.error('Erro ao excluir item:', error);
      Alert.alert('Erro', 'Não foi possível excluir o item.');
    }
  };

  const renderizarItem = (item: ItemEstoque) => (
    <View key={item.id} style={estilos.containerItem}>
      <View style={[estilos.column, { flex: 2, alignItems: 'flex-start' }]}>
        <Text style={estilos.nomeItem}>{item.produtos}</Text>
      </View>
      <View style={[estilos.column, { flex: 1}]}>
        <Text style={estilos.valorTexto}>{`${item.valor} R$`}</Text>
      </View>
      <View style={[estilos.column, { flex: 2.5}]}>
        <Text style={estilos.quantidadeTexto}>{item.quantidade}</Text>
      </View>
      <View style={estilos.acoes}>
        <TouchableOpacity onPress={() => editarItem(item)}>
          <Icon name="pencil" size={18} color="#666" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => registrarVenda(item)}>
          <Icon name="shopping-cart" size={20} color="#4CAF50" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => excluirItem(item.id)}>
          <Icon name="trash" size={18} color="#666" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderizarVenda = (venda: Venda, index: number) => (
    <View key={index} style={estilos.containerItem}>
      <Text style={estilos.dadosItem}>{venda.produto}</Text>
      <Text style={estilos.dadosItem}>{`${venda.valor} R$`}</Text>
      <Text style={estilos.dadosItem}>{venda.quantidadeVendida}</Text>
    </View>
  );

  return (
    <View style={estilos.container}>
      <View style={estilos.header}>
        <Text style={estilos.titulo}>Controle de Estoque</Text>
        <Text style={estilos.subtitulo}>Mimos e Crochê</Text>
      </View>
      <View style={estilos.totalContainer}>
        <Text style={estilos.totalText}>Total de items: {totalItens}</Text>
        <TouchableOpacity style={estilos.addButton} onPress={adicionarItem}>
          <Text style={estilos.addButtonText}>Adicionar</Text>
        </TouchableOpacity>
      </View>
      <View style={estilos.totalContainer}>
        <TouchableOpacity style={estilos.addButton2} onPress={abrirModalVendas}>
          <Text style={estilos.addButtonText}>Vendas do Dia</Text>
        </TouchableOpacity>
        <TouchableOpacity style={estilos.addButton3} onPress={abrirModalVendasTotais}>
          <Text style={estilos.addButtonText}>Vendas</Text>
        </TouchableOpacity>
      </View>
      <View style={estilos.searchContainer}>
        <Text style={estilos.searchLabel}>Pesquise aqui:</Text>
        <View style={estilos.searchInputContainer}>
          <TextInput
            style={estilos.searchInput}
            placeholder="Pesquise aqui"
            value={searchText}
            onChangeText={setSearchText}
            placeholderTextColor="#000"
          />
        </View>
      </View>
      <View style={estilos.cabecalhoTabela}>
        <Text style={estilos.cabecalhoTexto}>item</Text>
        <Text style={estilos.cabecalhoTexto}>valor</Text>
        <Text style={estilos.cabecalhoTexto}>quantidade</Text>
        <Text style={estilos.cabecalhoTexto}>editar/excluir</Text>
      </View>
      <ScrollView>
        {itensFiltrados.map(renderizarItem)}
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

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVendasVisivel}
          onRequestClose={fecharModalVendas}
      >
        <View style={estilos.centeredView}>
          <View style={estilos.modalView}>
            <Text style={estilos.modalTitle}>Vendas do Dia</Text>

            {/* Cabeçalhos */}
            <View style={estilos.headerRow}>
              <Text style={estilos.headerItem}>Item</Text>
              <Text style={estilos.headerItem}>Valor</Text>
              <Text style={estilos.headerItem}>Quantidade</Text>
            </View>

            {/* Lista de vendas */}
            {vendasDoDia.length > 0 ? (
              vendasDoDia.map(renderizarVenda)
            ) : (
              <Text style={{ color: 'black', textAlign: 'center', marginVertical: 10 }}>
                Nenhuma venda registrada hoje.
              </Text>
            )}

            {/* Botão de fechar */}
            <TouchableOpacity
              style={estilos.botaoSalvar}
              onPress={salvarDia}
            >
              <Text style={estilos.textoBotaoSalvar}>Salvar Dia</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={estilos.botaoCancelar}
              onPress={fecharModalVendas}
            >
              <Text style={estilos.textoBotaoCancelar}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVendasTotaisVisivel}
        onRequestClose={fecharModalVendasTotais}
      >
        <View style={estilos.centeredView}>
          <View style={estilos.modalView}>
            <Text style={estilos.modalTitle}>Vendas Totais</Text>

            {/* Lista de Dias com Vendas */}
            {diasComVendas.length > 0 ? (
              diasComVendas.map((dia, index) => (
                <TouchableOpacity
                  key={index}
                  style={estilos.itemDia}
                  onPress={() => selecionarDia(dia.data)}
                >
                  <Text style={estilos.textoDia}>
                    {`Dia ${dia.data}: ${dia.quantidadeTotal} vendas`}
                  </Text>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={{ color: 'black', textAlign: 'center', marginVertical: 10 }}>
                Nenhuma venda registrada.
              </Text>
            )}

            {/* Botão Fechar */}
            <TouchableOpacity
              style={estilos.botaoCancelar}
              onPress={fecharModalVendasTotais}
            >
              <Text style={estilos.textoBotaoCancelar}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalDetalhesDiaVisivel}
        onRequestClose={fecharModalDetalhesDia}
      >
        <View style={estilos.centeredView}>
          <View style={estilos.modalView}>
            <Text style={estilos.modalTitle}>Vendas do dia {dataSelecionada}</Text>

            <View style={estilos.headerRow}>
              <Text style={estilos.headerItem}>Item</Text>
              <Text style={estilos.headerItem}>Valor</Text>
              <Text style={estilos.headerItem}>Quantidade</Text>
            </View>

            <ScrollView style={estilos.scrollViewVendas}>
              {vendasDiaSelecionado.map((venda, index) => (
                <View key={index} style={estilos.itemVenda}>
                  <Text style={estilos.dadosItem}>{venda.produto}</Text>
                  <Text style={estilos.dadosItem}>{`${venda.valor} R$`}</Text>
                  <Text style={estilos.dadosItem}>{venda.quantidadeVendida}</Text>
                </View>
              ))}
            </ScrollView>

            {/* Resumo das vendas */}
            <View style={estilos.resumoVendas}>
              <Text style={estilos.textoResumo}>
                Total de itens: {vendasDiaSelecionado.reduce((acc, venda) => acc + venda.quantidadeVendida, 0)}
              </Text>
              <Text style={estilos.textoResumo}>
                Valor total: R$ {vendasDiaSelecionado.reduce((acc, venda) => acc + (venda.valor * venda.quantidadeVendida), 0).toFixed(2)}
              </Text>
            </View>

            <TouchableOpacity
              style={estilos.botaoCancelar}
              onPress={fecharModalDetalhesDia}
            >
              <Text style={estilos.textoBotaoCancelar}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalAdicionarVisivel}
        onRequestClose={() => setModalAdicionarVisivel(false)}
      >
        <View style={estilos.centeredView}>
          <View style={estilos.modalView}>
            <TextInput
              style={estilos.input}
              placeholder="Nome do produto"
              value={novoProduto}
              onChangeText={setNovoProduto}
            />
            <TextInput
              style={estilos.input}
              placeholder="Valor"
              value={novoValor}
              onChangeText={setNovoValor}
              keyboardType="numeric"
            />
            <TextInput
              style={estilos.input}
              placeholder="Quantidade"
              value={novaQuantidade}
              onChangeText={setNovaQuantidade}
              keyboardType="numeric"
            />
            <TouchableOpacity style={estilos.botaoSalvar} onPress={salvarNovoItem}>
              <Text style={estilos.textoBotaoSalvar}>Salvar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={estilos.botaoCancelar} onPress={() => setModalAdicionarVisivel(false)}>
              <Text style={estilos.textoBotaoCancelar}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalEditarVisivel}
        onRequestClose={() => setModalEditarVisivel(false)}
      >
        <View style={estilos.centeredView}>
          <View style={estilos.modalView}>
            <TextInput
              style={estilos.input}
              placeholder="Nome do produto"
              value={itemParaEditar?.produtos}
              onChangeText={(text) => setItemParaEditar(prev => prev ? {...prev, produtos: text} : null)}
            />
            <TextInput
              style={estilos.input}
              placeholder="Valor"
              value={itemParaEditar?.valor.toString()}
              onChangeText={(text) => setItemParaEditar(prev => prev ? {...prev, valor: parseFloat(text) || 0} : null)}
              keyboardType="numeric"
            />
            <TextInput
              style={estilos.input}
              placeholder="Quantidade"
              value={itemParaEditar?.quantidade.toString()}
              onChangeText={(text) => setItemParaEditar(prev => prev ? {...prev, quantidade: parseInt(text) || 0} : null)}
              keyboardType="numeric"
            />
            <TouchableOpacity style={estilos.botaoSalvar} onPress={salvarEdicaoItem}>
              <Text style={estilos.textoBotaoSalvar}>Salvar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={estilos.botaoCancelar} onPress={() => setModalEditarVisivel(false)}>
              <Text style={estilos.textoBotaoCancelar}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalExcluirVisivel}
        onRequestClose={() => setModalExcluirVisivel(false)}
      >
        <View style={estilos.centeredView}>
          <View style={estilos.modalView}>
            <Text style={estilos.textoConfirmacao}>Tem certeza que deseja excluir este item?</Text>
            <TouchableOpacity style={estilos.botaoConfirmar} onPress={confirmarExclusao}>
              <Text style={estilos.textoBotaoConfirmar}>Confirmar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={estilos.botaoCancelar} onPress={() => setModalExcluirVisivel(false)}>
              <Text style={estilos.textoBotaoCancelar}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const estilos = StyleSheet.create({
  header: {
    alignItems: 'center',
    marginVertical: 10,
  },
  titulo: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitulo: {
    color: 'white',
    fontSize: 18,
    marginTop: 5,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 15,
  },
  totalText: {
    color: 'white',
    backgroundColor: '#333',
    padding: 10,
    borderRadius: 20,
    paddingHorizontal: 20,
    fontSize: 16,
  },
  addButton: {
    backgroundColor: '#333',
    padding: 10,
    borderRadius: 20,
    paddingHorizontal: 20,
  },
  addButton2: {
    backgroundColor: '#333',
    padding: 10,
    width: 160,
    borderRadius: 20,
    paddingHorizontal: 20,
    textAlign: 'center',
    alignItems: 'center'
  },
  addButton3: {
    backgroundColor: '#333',
    padding: 10,
    width: 110,
    borderRadius: 20,
    paddingHorizontal: 20,
    textAlign: 'center',
    alignItems: 'center'
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
  },
  searchContainer: {
    backgroundColor: '#1E1E1E',
    padding: 8,
    borderRadius: 4,
    marginBottom: 10,
   },
   searchLabel: {
    color: 'white',
    fontSize: 14,
    marginBottom: 4,
   },
   searchInputContainer: {
    backgroundColor: 'white',
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 10,
   },
   searchInput: {
    flex: 1,
    padding: 8,
    fontSize: 16,
   },
  container: {
    flex: 1,
    backgroundColor: '#1E1E1E',
    padding: 16,
  },
  containerTotal: {
    flexDirection: 'row',
    backgroundColor: '#333',
    padding: 10,
    borderRadius: 20,
    marginVertical: 10,
  },
  labelTotal: {
    color: 'white',
    fontSize: 16,
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
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  itemColumn: {
    flex: 1,
    justifyContent: 'center',
  },
  containerItem: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 8,
    marginVertical: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  column: {
    flex: 2.5,
  },
  itemTexto: {
    textAlign: 'center', // Centraliza valores e quantidades
    color: '#333',
  },
  nomeItem: {
    textAlign: 'left',
    fontSize: 16,
    color: '#333',
  },
  valorTexto: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  quantidadeTexto: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  acoes: {
    flexDirection: 'row',
    width: 70,
    justifyContent: 'space-between',
  },
  acaoButton: {
    padding: 5,
  },
  acaoBotao: {
    fontSize: 18,
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 16, // Adiciona padding nas laterais
  },
  modalView: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    width: '100%', // Faz o modal ocupar 100% da largura disponível
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
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
    width: '100%', // Garante que os inputs também ocupem toda a largura
  },
  botaoSalvar: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
    width: '100%', // Garante que o botão ocupe toda a largura
    alignItems: 'center',
  },
  textoBotaoSalvar: {
    color: 'white',
    fontWeight: 'bold',
  },
  botaoCancelar: {
    backgroundColor: '#f44336',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
    width: '100%', // Garante que o botão ocupe toda a largura
    alignItems: 'center',
  },
  textoBotaoCancelar: {
    color: 'white',
    fontWeight: 'bold',
  },
  textoConfirmacao: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
  },
  botaoConfirmar: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
    width: '100%',
    alignItems: 'center',
  },
  textoBotaoConfirmar: {
    color: 'white',
    fontWeight: 'bold',
  },
  modalTitle: { 
    fontSize: 18, 
    fontWeight: 'bold',
    marginBottom: 10
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    paddingBottom: 5,
  },
  headerItem: {
    flex: 1,
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#333',
  },
  dadosItem: {
    flex: 1,
    textAlign: 'center',
    color: '#333',
  },
  itemDia: {
    padding: 10,
    marginVertical: 5,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
  },
  textoDia: {
    color: 'black',
    fontWeight: 'bold',
  },
  scrollViewVendas: {
    maxHeight: 300,
    width: '100%',
  },
  itemVenda: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  resumoVendas: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 5,
    width: '100%',
  },
  textoResumo: {
    fontSize: 16,
    color: '#333',
    marginVertical: 2,
    fontWeight: 'bold',
  },
});

export default TelaControleEstoque;